import {mkdir, open, readdir, readFile} from "fs/promises";
import path, { dirname } from "path";
import { FilePathOptionList } from "./interfaces/file-path-list";

const dir = process.cwd();

async function getTemplateConfig(customPath?: string): Promise<any> {
  let configPath = path.join(dir, customPath ?? "template.config.json");

  try {
    const extension = configPath.split(".").pop();

    if(extension !== "json") {
      throw new Error("Please provide a .json template config file");  
    }
    
    const configContent = await readFile(configPath, 'utf-8');
    const templateConfig = JSON.parse(configContent);

    return templateConfig;
  } catch(error) {
    throw new Error("Please provide a .json template config file");
  }  
}

async function init() {
  const config = await getTemplateConfig(process.argv[2]);
  
  const newReduxPath = path.join(dir, `src/${config['name']}/_redux`);
  const newReduxDir = await mkdir(newReduxPath, {recursive: true});
  
  const filePaths: FilePathOptionList = [
    {
      read_from_path: "src/template/_redux/template-crud.js",
      write_to_path: `${newReduxPath}/${config['name']}-crud.js`,
    },
    {
      read_from_path: "src/template/_redux/template-slice.js",
      write_to_path: `${newReduxPath}/${config['name']}-slice.js`,
    },
    {
      read_from_path: "src/template/_redux/template-action.js",
      write_to_path: `${newReduxPath}/${config['name']}-action.js`,
    }
  ];
  
  const newReduxFiles = await Promise.all(
    filePaths.map(
      ({read_from_path, write_to_path}) => generateTemplatedFile(read_from_path, write_to_path, config)
    )
  );

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

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.substring(1);
}

// (async () => {
//   try {
//     await init();
  
//     console.log('Template generated successfully');
//   } catch(error) {
//     console.error(error);
//     console.error("Metronome was terminated with failure.");
//   }
// })();

async function generateTemplatedFile(read_from: string, write_to: string, config: any) {
  const readFrom = await open(read_from, 'r+');

  const writeTo = await open(write_to, 'w+');

  const readStream = readFrom.createReadStream();
  const writeStream = writeTo.createWriteStream();

  const readWrite = await new Promise<string>((resolve, reject) => {
    readStream.on("data", (chunk) => {
      const line = chunk.toString();

      const newLine = line.replace(/@_@template_name@_@/g, config['name']).replace(/@~@template_name@~@/g, capitalizeFirstLetter((config['name'])));

      writeStream.write(newLine);
    });

    readStream.on("end", () => {
      readFrom.close();
      writeTo.close();
      
      writeStream.end();

      resolve(write_to);
    });
  });

  return readWrite;
}

async function traverse(root_read_path: string, root_write_path: string, config:any) {
  const readFileOrDirNames = await readdir(root_read_path);

  if(readFileOrDirNames.length === 0) {
    return;
  }
  
  const newWriteDir = await mkdir(root_write_path);
  
  const readDirectories = readFileOrDirNames.filter((name) => !/\w+\.\w+/.test(name));
  const readFileNames = readFileOrDirNames.filter((name) => /\w+\.\w+/.test(name));

  const newFiles = await Promise.all(
      readFileNames.map((readFrom) => 
        generateTemplatedFile(
          root_read_path + `/${readFrom}`, 
          root_write_path + `/${readFrom.replace(/template/g, config['name']).replace(/Template/g, config['name'])}`, config
        )
      )
  );

  readDirectories.forEach(async (currdir) => {
    traverse(path.join(root_read_path, currdir), path.join(root_write_path, currdir), config);
  });
}

(async () => {
  const config = await getTemplateConfig(process.argv[2]);
  const rootRead = path.join(dir, '/src/template');
  const rootWrite = path.join(dir, `/src/${config['name']}`);

  await traverse(rootRead, rootWrite, config);
})();


