function generateFishVertices(time) {
  var d = Math.sin(time / 200) / 4;

  return new Float32Array([
    -1, 0, 0,           // 0
    0, 0.7, 0,          // 1
    0, -0.7, 0,         // 2
    1.5, 0.6, 0 + d,    // 3
    1.5, -0.6, 0 + d,   // 4
    2.5, 0.2, 0,        // 5
    2.5, -0.2, 0,       // 6
    3.5, 0.8, 0 - d,    // 7
    3.5, -0.8, 0 - d,   // 8
    0, 0, 0.3,          // 9
    0, 0, -0.3,         // 10
    1.5, 0, 0.3 + d,    // 11
    1.5, 0, -0.3 + d,   // 12
    2.5, 0, 0.2,        // 13
    2.5, 0, -0.2,       // 14
  ]);
}

var fishIndices = new Float32Array([
  0, 1, 9,
  0, 1, 10,
  0, 2, 9,
  0, 2, 10,
  1, 9, 11,
  2, 9, 11,
  1, 10, 12,
  2, 10, 12,
  1, 3, 11,
  2, 4, 11,
  1, 3, 12,
  2, 4, 12,
  3, 11, 13,
  3, 12, 14,
  11, 4, 13,
  12, 4, 14,
  3, 5, 13,
  3, 5, 14,
  4, 13, 6,
  4, 14, 6,
  5, 13, 7,
  5, 14, 7,
  6, 13, 8,
  6, 14, 8,
  13, 7, 8,
  14, 7, 8
]);

var fishTexture = new Float32Array([
  -1, 0,
  0, 0.7,
  0, -0.7,
  1.5, 0.6,
  1.5, -0.6,
  2.5, 0.2,
  2.5, -0.2,
  3.5, 0.8,
  3.5, -0.8,
  0, 0,
  0, 0,
  1.5, 0,
  1.5, 0,
  2.5, 0,
  2.5, 0,
]);

var fishNormal = new Float32Array([
  -1, 0, 0,
  0, 1, 0,
  0, -1, 0,
  0, 1, 0,
  0, -1, 0,
  0, 1, 0,
  0, -1, 0,
  0, 1, 0,
  0, -1, 0,
  0, 0, 1,
  0, 0, -1,
  0, 0, 1,
  0, 0, -1,
  0, 0, 1,
  0, 0, -1,
]);

class FishSGNode extends SGNode {

  constructor(scale, children) {
    super(children);
    //when creating the fish, set the texture
    this.textureNode = new AdvancedTextureSGNode(scale, 1, 'u_tex1');
    //set the material to be the texture
    this.materialNode = new MaterialSGNode(this.textureNode);
    this.materialNode.ambient = [0.4, 0.4, 0.4, 1];
  }

  render(context) {
    //changes the vertices of the fish
    //makes the fish tail move
    this.textureNode.children[0] = new RenderSGNode({
      position : generateFishVertices(context.timeInMilliseconds),
      normal : fishNormal,
      texture : fishTexture,
      index : fishIndices,
    });

    this.materialNode.render(context);

    super.render(context);
  }
}
