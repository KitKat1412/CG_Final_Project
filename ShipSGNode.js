var shipVertices = new Float32Array([
  -2, -1, 0,
  -1, -1, 0,
  0, -1, 0,
  1, -1, 0,
  2, -1, 0,
  -1, -1, 1,
  0, -1, 1,
  1, -1, 1,
  -1, -1, -1,
  0, -1, -1,
  1, -1, -1,
  -3, 1, 0,
  -2, 1, 1,
  -1, 1, 2,
  0, 1, 2,
  1, 1, 2,
  2, 1, 1,
  3, 1, 0,
  -2, 1, -1,
  -1, 1, -2,
  0, 1, -2,
  1, 1, -2,
  2, 1, -1,
  -2.5, 0, 0,
  -1.5, 0, 0,
  0, 0, 0,
  1.5, 0, 0,
  2.5, 0, 0,
  -1, 0, 1.5,
  0, 0, 1.5,
  1, 0, 1.5,
  -1, 0, -1.5,
  0, 0, -1.5,
  1, 0, -1.5,
]);

var shipIndices = new Float32Array([
  0, 1, 5,
  1, 5, 6,
  1, 6, 2,
  6, 2, 7,
  2, 7, 3,
  3, 7, 4,
  0, 1, 8,
  1, 2, 8,
  2, 8, 9,
  2, 3, 9,
  3, 9, 10,
  3, 10, 4,
  11, 12, 0,
  0, 12, 13,
  0, 13, 5,
  13, 5, 14,
  5, 6, 14,
  14, 6, 15,
  15, 6, 7,
  15, 7, 16,
  16, 7, 4,
  17, 16, 4,
  0, 11, 18,
  0, 8, 18,
  18, 8, 19,
  8, 19, 9,
  19, 9, 20,
  9, 20, 10,
  10, 20, 21,
  10, 21, 22,
  10, 4, 22,
  22, 4, 17,
  23, 24, 28,
  24, 28, 29,
  24, 29, 25,
  29, 25, 30,
  25, 30, 26,
  26, 30, 27,
  23, 24, 31,
  24, 25, 31,
  25, 31, 32,
  25, 26, 32,
  26, 32, 33,
  26, 33, 27,
]);

var shipTexture = new Float32Array([
  -2, -1,
  -1, -1,
  0, -1,
  1, -1,
  2, -1,
  -1, -1,
  0, -1,
  1, -1,
  -1, -1,
  0, -1,
  1, -1,
  -3, 1,
  -2, 1,
  -1, 1,
  0, 1,
  1, 1,
  2, 1,
  3, 1,
  -2, 1,
  -1, 1,
  0, 1,
  1, 1,
  2, 1,
  -2.5, 0,
  -1.5, 0,
  0, 0,
  1.5, 0,
  2.5, 0,
  -1, 1.5,
  0, 1.5,
  1, 1.5,
  -1, -1.5,
  0, -1.5,
  1, -1.5,
]);

var shipNormal = new Float32Array([
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  -1, 0, 0,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  1, 0, 0,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
]);

var cubeVertices = new Float32Array([
   -1, -1, -1,
    1, -1, -1,
    1, -1,  1,
   -1, -1,  1,
   -1,  1, -1,
    1,  1, -1,
    1,  1,  1,
   -1,  1,  1,
]);

var cubeTextures = new Float32Array([
  -1, -1,
   1, -1,
   1,  1,
  -1,  1,
   1,  1,
  -1,  1,
  -1, -1,
   1, -1,
]);

var cubeIndices =  new Float32Array([
  0, 1, 3,
  1, 2, 3,
  0, 4, 5,
  0, 5, 1,
  5, 1, 2,
  2, 5, 6,
  2, 3, 6,
  6, 3, 7,
  7, 0, 4,
  0, 3, 7,
  4, 5, 7,
  5, 7, 6,
]);

class ShipSGNode extends SGNode {

  constructor(resources, wood, children) {
    super(children);

    this.renderNode = new MaterialSGNode(
      //texture the ship with wood
      new AdvancedTextureSGNode(wood, 1, 'u_tex1', [
      new RenderSGNode({
        position : shipVertices,
        normal : shipNormal,
        texture : shipTexture,
        index : shipIndices,
      }),
      //place a box on the ship (also textured with wood)
      new RenderSGNode({
        position : cubeVertices,
        normal : cubeVertices,
        texture : cubeTextures,
        index : cubeIndices,
      }),
      //place a light on the front of the ship
      new TransformationSGNode(glm.translate(-4, 1, 0),
        new SpotlightSGNode(glm.translate([0, 0, 0]),
          createLightSphere(resources.vs_single, resources.fs_single)
        )
      )
    ]));
    this.renderNode.ambient = [0.6, 0.6, 0.6, 1];
  }

  render(context) {
    this.renderNode.render(context);

    super.render(context);
  }
}
