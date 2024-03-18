/**
 * Code modified from https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
 * @param obj Anything that needs to be verified as an object.
 */
function isObject(obj: any): obj is Record<string, any> {
    return obj === Object(obj) && !Array.isArray(obj) && typeof obj !== 'function';
}

/**
 * Code modified from https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
 * @param str A string in snake_case, that needs to be camelCase.
 */
function toCamelCase(str: string): string {
    return str.replace(/(_[a-z])/g, $1 => $1.toUpperCase().replace('_', ''));
}

/**
 * Code modified from https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
 * @param obj Any object whose keys are in snake_case, and need to be camelCase.
 */
export default function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => convertKeysToCamelCase(v));
    } else if (obj !== null && isObject(obj)) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [toCamelCase(key)]: convertKeysToCamelCase(obj[key]),
            }),
            {},
        );
    }
    return obj;
}