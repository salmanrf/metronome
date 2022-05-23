import {mkdir, open, readdir, readFile} from "fs/promises";
import path, { dirname } from "path";

const dir = process.cwd();

async function getTemplateConfig(customPath?: string): Promise<object> {
  let configPath = path.join(dir, customPath ?? "template.config.json");

  console.log('configPath', configPath);
  
  try {
    const extension = configPath.split(".").pop();

    if(extension !== "json") {
      throw new Error("Please provide a .json template config file");  
    }
    
    const configContent = await readFile(configPath, 'utf-8');
    
    console.log('config', configContent);
    
    const templateConfig = JSON.parse(configContent);

    return templateConfig;
  } catch(error) {
    throw new Error("Please provide a .json template config file");
  }  
}

async function init() {
  const config = await getTemplateConfig(process.argv[2]);
  
  await createCrudFile(config);
  
  const dirs = await readdir(path.join(dir, '../src'));

  if(!(dirs instanceof Array)) {
    throw new Error("Invalid Directory Structure.");
  }
  
  const metronicDir = dirs.find((path) => path === '_metronic');
  const metronicAppDir = dirs.find((path) => path === 'app');

  if(!metronicDir || !metronicAppDir) {
    throw new Error("Invalid Directory Structure.");
  }
}

(async () => {
  try {
    await init();
  
    console.log('Template generated successfully');
  } catch(error) {
    console.error(error);
    console.error("Metronome was terminated with failure.");
  }
})();

async function createCrudFile(config: any): Promise<string> {
  const templateCrudFile = await open(path.join(dir, 'src/template/_redux/template-crud.js'), 'r+');

  const newReduxPath = `src/${config['name']}`;
  const newReduxDir = await mkdir(path.join(dir, `src/${config['name']}`));
  const newCrudFile = await open(path.join(dir, newReduxPath, config['name'] + ".js"), 'w+');

  const readStream = templateCrudFile.createReadStream();
  const writeStream = newCrudFile.createWriteStream();

  const readWrite = await new Promise<string>((resolve, reject) => {
    readStream.on("data", (chunk) => {
      const line = chunk.toString();

      const newLine = line.replace(/@_@template_name@_@/g, config['name']).replace(/@~@template_name@~@/g, capitalizeFirstLetter((config['name'])));

      writeStream.write(newLine);
    });

    readStream.on("end", () => {
      templateCrudFile.close();
      newCrudFile.close();
      
      writeStream.end();

      resolve(path.join(dir, newReduxPath, config['name'] + ".js"));
    });
  });

  return readWrite;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.substring(1);
}




