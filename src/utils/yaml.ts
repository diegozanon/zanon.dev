import * as yaml from 'js-yaml';

export const yamlToJson = (data: string): any => {
    return yaml.safeLoad(data);
}

export const jsonToYaml = (data: object): string => {
    let yamlStyle = {
        'styles': {
            '!!null': 'canonical' // dump null as ~
        }
    };

    return yaml.safeDump(data, yamlStyle).trim();
}