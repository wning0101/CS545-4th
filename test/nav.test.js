import nav from "../bots/nav";
import castle from "../bots/castle";
import {expect} from "chai"; 

describe("Test for nav", () => {
  it("toCompassDir should throw an error", () => {
    expect(nav.toCompassDir).to.throw("Dir is manadatory!");
  });
});

describe("Test for castle", () => {
  it("should get zero messaging robot", () => {
    const bots = castle.getMessagingRobots([{castle_talk: null}])
    expect(bots).to.be.an("array").that.is.empty;
  });

  it("should get two messaging robot", () => {
    const bots = castle.getMessagingRobots([{castle_talk: true}, {castle_talk: null}, {castle_talk: true}])
    expect(bots).to.be.an("array").to.have.lengthOf(2);
  });

  it("should get three Crusaders", () => {
    const bots = castle.getMessagingRobots([{castle_talk: true}, {castle_talk: true}, {castle_talk: true}])
    expect(bots).to.be.an("array").to.have.lengthOf(3);
  });

  it("should get 1 Prophet", () => {
    const bots = castle.getMessagingRobots([{castle_talk: null}, {castle_talk: null}, {castle_talk: true}])
    expect(bots).to.be.an("array").to.have.lengthOf(1);
  });

});




