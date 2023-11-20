import { time } from "console";
import fs from "fs";
import path, { parse } from "path";

export const revalidate = 300;

export async function GET(req, res) {
  const slug = "azclothes";
  const theme = await GetTheme(slug);
  return new Response(theme, {
    status: 200,
    headers: {
      "Content-type": "text/css",
    },
  });
}

async function GetFileTheme() {
  const filePath = path.join("src/app/theme-template.scss");
  const result = await new Promise((resolve) => {
    fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
      if (!err) {
        resolve(data);
      } else {
        resolve(null);
      }
    });
  });
  return result;
}

async function GetCSSFileTheme(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, "theme.css");
  const result = await new Promise((resolve) => {
    fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
      if (!err) {
        resolve(data);
      } else {
        resolve(null);
      }
    });
  });
  return result;
}

async function GetTheme(slug) {
  const themeOptions = await GetThemeOptions();
  const fileTheme = await GetFileTheme();
  const parsedTheme = await ParseTheme(themeOptions, fileTheme);
  const exist = await ExistsTimestampFile(slug);
  if (!exist) {
    await WriteTimestampFile(slug);
    await WriteTheme(parsedTheme, slug);
    await BuildTheme(slug);
    console.log("Tema gerado com sucesso");
  }
  const timestamp = await ReadTimestampFile(slug);
  const now = new Date().getTime();
  if (now > timestamp) {
    await ClearThemeFiles(slug);
    await WriteTheme(parsedTheme, slug);
    await BuildTheme(slug);
    await UpdateTimestampFile(slug);
  } else {
    console.log("Proximo build em", (timestamp - now) / 1000, "segundos");
  }
  return await GetCSSFileTheme(slug);
}

async function GetThemeOptions() {
  return {
    primaryColor: "#212121",
  };
}

async function ReadTimestampFile(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, ".timestamp");
  const result = await new Promise((resolve) => {
    fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
      if (!err) {
        resolve(parseInt(data));
      } else {
        resolve(null);
      }
    });
  });
  return result;
}

async function WriteTimestampFile(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, ".timestamp");
  const timestamp = new Date().getTime() + 300000;
  if (!fs.existsSync(themePath)) fs.mkdirSync(themePath);
  const result = await new Promise((resolve) => {
    fs.writeFile(filePath, String(timestamp), function (err) {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return result;
}

async function UpdateTimestampFile(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, ".timestamp");
  const timestamp = new Date().getTime() + 300000;
  const result = await new Promise((resolve) => {
    fs.writeFile(filePath, String(timestamp), function (err) {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return result;
}

async function ExistsTimestampFile(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, ".timestamp");
  if (fs.existsSync(filePath)) return true;
  return false;
}

async function ParseTheme(themeOptions, fileTheme) {
  let parsedTheme = "";
  parsedTheme = fileTheme.replace(
    "'${primary_color}'",
    themeOptions.primaryColor
  );
  return parsedTheme;
}

async function WriteTheme(theme, slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const filePath = path.join(themePath, "theme.scss");
  if (!fs.existsSync(themePath)) fs.mkdirSync(themePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const result = await new Promise((resolve) => {
    fs.writeFile(filePath, theme, function (err) {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return result;
}

async function BuildTheme(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const inputPath = path.join(themePath, "theme.scss");
  const outputPath = path.join(themePath, "theme.css");
  const command = `sass ${inputPath} ${outputPath}`;
  const exec = require("child_process").exec;
  const result = await new Promise((resolve) => {
    exec(command, function (err) {
      if (err) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
  return result;
}

async function ClearThemeFiles(slug) {
  const themePath = path.join(`public/themes/${slug}`);
  const inputPath = path.join(themePath, "theme.scss");
  const outputPath = path.join(themePath, "theme.css");
  const timestampPath = path.join(themePath, ".timestamp");
  const outputMapPath = path.join(themePath, "theme.css.map");
  if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  if (fs.existsSync(timestampPath)) fs.unlinkSync(timestampPath);
  if (fs.existsSync(themePath)) fs.rmdirSync(themePath);
  if (fs.existsSync(outputMapPath)) fs.unlinkSync(outputMapPath);
}
