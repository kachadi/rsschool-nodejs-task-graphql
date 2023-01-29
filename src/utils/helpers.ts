
const isValidPatchedData = (data: any, requiredFields: string[]) => {
  const dataKeys = Object.keys(data);

  if (!dataKeys.length) {
    return false;
  }

  return dataKeys.every((key) => requiredFields.includes(key));
};

export { isValidPatchedData };
