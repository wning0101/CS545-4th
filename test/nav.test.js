const nav = require('../bots/nav');

describe("Test for toCompassDir", () => {
  it("Should throw an error", () => {
    expect(nav.toCompassDir()).to.throw();
  });
});
