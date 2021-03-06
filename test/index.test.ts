import message from "../src";

describe("the library", () => {
  it("Can't be required", () => {
    expect(message).toBe("This module should not be require()'d");
  });
});
