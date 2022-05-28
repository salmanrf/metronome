import {mkdir, open, readdir, readFile} from "fs/promises";
import path, { dirname } from "path";
import { capitalizeFirstLetter } from "./common/utils/string.utils";
import { FilePathOptionList } from "./common/interfaces/file-path-list";
import * as readline from 'readline';
import { generateTemplatedFile } from "./template-processor/template-processor";

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
          root_write_path + `/${readFrom.replace(/template/g, config['name']).replace(/Template/g, capitalizeFirstLetter(config['name']))}`, config
        )
      )
  );

  readDirectories.forEach(async (currdir) => {
    traverse(
      path.join(root_read_path, currdir), 
      path.join(
        root_write_path, currdir.replace(/template/g, 
        config['name']).replace(/Template/g, capitalizeFirstLetter(config['name']))
      ), 
      config
    );
  });
}

(async () => {
  const config = await getTemplateConfig(process.argv[2]);
  const rootRead = path.join(dir, '/src/template');
  const rootWrite = path.join(dir, `/src/${config['name']}`);

  await traverse(rootRead, rootWrite, config);
})();