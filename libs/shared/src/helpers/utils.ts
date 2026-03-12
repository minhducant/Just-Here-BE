export const checkElementsExist = (
  sourceArray: number[],
  targetArray: number[],
): boolean => {
  return sourceArray?.some((element) => targetArray.includes(element)) ?? false;
};
