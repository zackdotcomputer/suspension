import message from "../index";

describe("the library", () => {
  it("Can't be required", () => {
    expect(message).toBe("This module should not be require()'d");
  });
});
