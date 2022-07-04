export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.substring(1);
}

export function wordify(string: string, delimiter: string) {
  return string
    .split(delimiter)
    .map((str) => capitalizeFirstLetter(str))
    .join(" ") 
}