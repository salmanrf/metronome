import { open } from "fs/promises";
import * as readline from "node:readline";
import { FIELD_TYPE } from "../common/helpers/field-types.helper";
import { capitalizeFirstLetter } from "../common/utils/string.utils";
import { FieldTemplate, FormGroupTemplate, GenOptionLoaderTemplate, OptionLoaderPreparation, OptionLoaderTemplate, SelectFieldTemplate } from "../template-placeholder/field.template";

export async function generateTemplatedFile(read_from: string, write_to: string, config: any) {
  const readFrom = await open(read_from, 'r+');

  const writeTo = await open(write_to, 'w+');

  const readStream = readFrom.createReadStream();
  const writeStream = writeTo.createWriteStream();
  const lineReader = readline.createInterface(readStream);

  const readWrite = await new Promise<string>((resolve, reject) => {
    lineReader.on("line", (line) => {
      const newLine = processLine(line, config);

      writeStream.write(newLine);
    });

    lineReader.on('close', () => {
      readFrom.close();
      writeTo.close();

      readStream.close();
      writeStream.close();

      resolve(write_to);
    });
  });

  return readWrite;
}

function processLine(line: string, config: any): string {
  if(/@template_entity_filter@/.test(line)) {
    return generateEntityInitialFilter(config);
  }

  if(/@template_entity_inital_value@/.test(line)) {
    return generateEntityInitialValue(config);
  }

  if(/@template_entity_filter_forms@/.test(line)) {
    return generateEntityFilterFields(line, config);
  }

  if(/@template_entity_schema@/.test(line)) {
    return generateEntityFormSchema(line, config);
  }

  if(/@template_form_option_loaders@/.test(line)) {
    return generateFormOptionLoaders(line, config);
  }

  if(/@template_entity_prepare_filter@/.test(line)) {
    return genereateFilterPreparation(line, config);
  }

  if(/@template_reference_options_preparations@/.test(line)) {
    return generateRefOptionsPreparation(line, config);
  }

  if(/@template_reference_options@/.test(line)) {
    return generateReferenceOptionsStates(line, config);
  }

  const input = 
    (line + '\r')
      .replace(/@_@template_name@_@/g, config['name'])
      .replace(/@~@template_name@~@/g, capitalizeFirstLetter((config['name'])))
      .replace(/@_@template_route@_@/g, config['base_route'])
  
  let output = input;

  return output;
}

function generateEntityInitialFilter(config: any): string {
  let entityInitialFilterString = '';
  
  const schemaFields = Object.keys(config['schema']);

  schemaFields.forEach((fieldKey) => {
    const field = (config['schema'] ?? {})[fieldKey];

    if(field['primary']) {
      return;
    }

    if(!field['filterable']) {
      return;
    }

    if(field['filter_by_range']) {
      entityInitialFilterString += `\t${fieldKey}_start: '',\r`;
      entityInitialFilterString += `\t${fieldKey}_end: '',\r`;

      return;
    }

    return entityInitialFilterString += `\t${fieldKey}: '',\r`;
  });

  return entityInitialFilterString;
}

function generateEntityInitialValue(config: any): string {
  let entityInitialValueString = '';
  
  const schemaFields = Object.keys(config['schema']);

  schemaFields.forEach((fieldKey) => {
    const field = (config['schema'] ?? {})[fieldKey];

    if(field['primary']) {
      return;
    }

    if(field['is_array']) {
      entityInitialValueString += `\t${fieldKey}: [],\r`;

      return;
    }

    return entityInitialValueString += `\t${fieldKey}: '',\r`;
  });

  return entityInitialValueString;
}

function generateEntityFilterFields(line: string, config: any): string {
  let initialFormFields = ``;

  const filterableFields = Object.keys(config['schema']).filter((key) => config['schema'][key]['filterable']);

  let currGroupIndex = 0;

  const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);
  
  for(let i = 0; i < filterableFields.length; i++) {
    const currentField = config['schema'][filterableFields[i]];

    if(currGroupIndex === 0) {
      initialFormFields += `${lineIndentation}<div className="form-group row">\n`;
    }

    let currentFieldTemplate = FieldTemplate;
    let reference_to = filterableFields[i];

    if(currentField['filter_by_select'] && currentField['reference_to']) {
      reference_to = currentField['reference_to'];
    }

    if(currentField['filter_by_select']) {
      currentFieldTemplate = SelectFieldTemplate;
    }

    initialFormFields += 
      currentFieldTemplate
        .replace(/@indent@/g, `  ${lineIndentation}`)
        .replace(/@field_name@/g, filterableFields[i])
        .replace(/@~field_name~@/g, capitalizeFirstLetter(filterableFields[i]))
        .replace(/@reference_name@/g, reference_to)
        .replace(/@~reference_name~@/g, capitalizeFirstLetter(reference_to))
        

    if(currGroupIndex === 2 || i === filterableFields.length - 1) {
      currGroupIndex = 0;
      initialFormFields += `${lineIndentation}</div>\n`;
    } else {
      currGroupIndex++
    }
  }

  return initialFormFields;
}

function generateEntityFormSchema(line: string, config: any): string {
  let initialSchemaFields = ``;

  const schema = config['schema'];

  if(!schema) {
    throw new Error("Invalid config format, unable to determine schema.");
  }
  
  const schemaFields = Object.keys(config['schema']).filter((key) => !config['schema'][key]['primary']);

  const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);

  schemaFields.forEach((key: string) => {
    const type = FIELD_TYPE[schema[key]['type']] ?? 'string';
    
    initialSchemaFields += `${lineIndentation}${key}: Yup.${type}().${schema[key]['nullable'] ? 'optional()' : 'required("")'},\n`;
  });

  return initialSchemaFields;
}

function generateFormOptionLoaders(line: string, config: any): string {
  let initialOptionLoaders = GenOptionLoaderTemplate + '\n\n';
  
  const schema = config['schema'];

  if(!schema) {
    throw new Error("Invalid config format, unable to determine schema.");
  }

  const referenceFields = Object.keys(schema).filter((key) => schema[key]['reference_to']);

  const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);
  
  referenceFields.forEach((key) => {
    const reference_to = schema[key]['reference_to'];

    initialOptionLoaders += 
      OptionLoaderTemplate
        .replace(/@reference_name@/g, reference_to)
        .replace(/@~reference_name~@/g, capitalizeFirstLetter(reference_to))

    initialOptionLoaders += '\n'
  });
  
  return initialOptionLoaders.replace(/@indent@/g, `  ${lineIndentation}`);
}

function genereateFilterPreparation(line: string, config: any): string {
    let initialFilter = ``;

    const schema = config['schema'];

    if(!schema) {
      throw new Error("Invalid config format, unable to determine schema.");
    }
    
    const filterableFields = Object.keys(config['schema']).filter((key) => config['schema'][key]['filterable']);

    const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);

    initialFilter += `${lineIndentation}const { ${filterableFields.reduce((prev, field, index) => prev + (index === filterableFields.length - 1 ? field : field + ', '), '')} } = values;\n\n`;

    filterableFields.forEach((field) => {
      initialFilter += `${lineIndentation}filter.${field} = ${field} ?? "";\n`;
    });

    return initialFilter;
}

function generateReferenceOptionsStates(line: string, config: any): string {
  const schema = config['schema'];

  if(!schema) {
    throw new Error("Invalid config format, unable to determine schema.");
  }
  
  const referenceFields = Object.keys(schema).filter((key) => schema[key]['reference_to']);
  
  const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);

  const referenceOptionsStates = referenceFields.reduce((prev, field, index) => {
    const reference_to = schema[field]['reference_to'];

    return prev + `@indent@const [${reference_to}Options, set${capitalizeFirstLetter(reference_to)}Options] = useState([]);\n`
  }, '')
  
  console.log('ref', referenceOptionsStates);
  
  
  return referenceOptionsStates
    .replace(/@indent@/g, `${lineIndentation}`);
}

function generateRefOptionsPreparation(line: string, config: any): string {
  let initialTemplate = OptionLoaderPreparation;

  const schema = config['schema'];

  if(!schema) {
    throw new Error("Invalid config format, unable to determine schema.");
  }
  
  const referenceFields = Object.keys(schema).filter((key) => schema[key]['reference_to']);
  
  const lineIndentation = ' '.repeat([...line.matchAll(/\s/g)].length);

  let optionsFetch = '';

  referenceFields.forEach((field, index) => {
    const reference_to = schema[field]['reference_to'];

    optionsFetch += `${index === 0 ? '' : '@indent@    '}search${capitalizeFirstLetter(reference_to)}(),\n`
  });
  
  let optionsSetup = '';

  optionsSetup += `const [${referenceFields.reduce((prev, field, index) => prev + (index === referenceFields.length - 1 ? schema[field]['reference_to'] + 'Res' : schema[field]['reference_to'] + 'Res' + ', '), '')}] = res;\n`;
  
  referenceFields.forEach((field, index) => {
    const reference_to = schema[field]['reference_to'];

    optionsSetup += `@indent@  const {data: ${reference_to}Data = {}} = ${reference_to}Res ?? {};\n`;
    optionsSetup += `@indent@  const {data: {items: ${reference_to}Items = []}} = ${reference_to}Data ?? {};\n`;
  });

  optionsSetup += '\n';
  
  referenceFields.forEach((field, index) => {
    const reference_to = schema[field]['reference_to'];

    optionsSetup += `@indent@  set${capitalizeFirstLetter(reference_to)}Options(${reference_to}Items.map(({uuid, name}) => ({label: name, value: uuid})));\n`;
  });
  
  initialTemplate = 
    initialTemplate
      .replace(/@template_fetch_options@/g, optionsFetch)
      .replace(/@template_options_setup@/g, optionsSetup)
      .replace(/@indent@/g, `${lineIndentation}`)
  
  
  return initialTemplate;
}