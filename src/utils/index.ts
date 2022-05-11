export type UrlJsonType = {
  [key: string]: string | number;
}
export function transUrlParams(urlJSON: UrlJsonType = {}): string {
    const v = Object.keys(urlJSON).reduce((url, key) => {
        return `${url}${('&' + key + '=' + urlJSON[key]) || ''}`
    }, '')
    return v
}