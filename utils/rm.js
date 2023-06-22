function removeDuplicates(array, property1, property2, property3) {
    const uniqueRecords = array.reduce((accumulator, current) => {
      const isDuplicate = accumulator.some((item) =>
        item[property1] === current[property1] &&
        item[property2] === current[property2] &&
        item[property3] === current[property3]
      );
  
      if (!isDuplicate) {
        accumulator.push(current);
      }
  
      return accumulator;
    }, []);
  
    return uniqueRecords;
  }
  
  // Example usage
  const data = [
    { id: 1, name: "John", age: 25.2 },
    { id: 2, name: "Jane", age: 30 },
    { id: 1, name: "John", age: 25.2 },
    { id: 3, name: "Bob", age: 40 },
    { id: 2, name: "Jane", age: 35 }
  ];
  
  const uniqueData = removeDuplicates(data, "id", "name", "age");
  console.log(uniqueData);