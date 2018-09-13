var hookVertices = new Float32Array([
  -1,  10,  0,    //0
  -1,  0,  0,     //1
   0, -1,  0,     //2
   1,  0,  0,     //3
  -0.9,  10,  0.1,//4
  -0.9,  0,  0.1, //5
   0, -0.9,  0.1, //6
   0.9,  0,  0.1, //7
  -0.9,  10,  -0.1,//8
  -0.9,  0,  -0.1,//9
   0, -0.9,  -0.1,//10
   0.9,  0,  -0.1,//11
]);

var hookNormal = new Float32Array([
  -1, 0, 0,
  -1, 0, 0,
  -1, 0, 0,
  -1, 0, 0,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
]);

var hookTexture = new Float32Array([
  1, 1,
  1, 0,
  1, -1,
  1, 1,
  1.1, 1,
  1.1, 0,
  1.1, -1,
  1.1, 1,
  1.2, 1,
  1.2, 0,
  1.2, -1,
  1.2, 1,
]);

var hookIndices = new Float32Array([
  0, 4, 8,
  3, 7, 11,
  0, 8, 1,
  1, 8, 9,
  8, 5, 1,
  5, 8, 4,
  0, 4, 5,
  0, 9, 4,
  1, 9, 2,
  2, 9, 10,
  9, 6, 2,
  6, 9, 5,
  1, 5, 6,
  1, 10, 5,
  2, 10, 3,
  3, 10, 11,
  10, 7, 3,
  7, 10, 6,
  2, 6, 7,
  2, 11, 6,
]);

class HookSGNode extends SGNode {

  constructor(metal, children) {
    super(children);

    this.renderNode = new MaterialSGNode(
      new AdvancedTextureSGNode(metal, 1, 'u_tex1', [ //set texture, unit, and uniform
      new RenderSGNode({ //child of the texture node
        position : hookVertices,
        normal : hookNormal,
        texture : hookTexture,
        index : hookIndices,
      })
    ]));
  }

  render(context) {
    this.renderNode.render(context);

    super.render(context);
  }
}
