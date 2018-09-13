class TerrainSGNode extends SGNode {

  constructor(grass, sand, rock, terrain_heightmap, children) {
    super(children);
    this.node = new MaterialSGNode(
      new AdvancedTextureSGNode(grass, 0, 'u_tex1', //apply grass texture at the top
      new AdvancedTextureSGNode(sand, 1, 'u_tex2', //apply sand texture in the middle
      new AdvancedTextureSGNode(rock, 2, 'u_tex3', //apply rock texture at the bottom
      new AdvancedTextureSGNode(terrain_heightmap, 3, 'u_height', //apply a terrain map as a texture
      new RenderSGNode(makePlane()) //render a plane
    )))));
  }

  render(context)
  {
    //pass values to the shader
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_isTerrain'), true);
    this.node.render(context);
    //disconnect from the shader
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_isTerrain'), false);
  }
}
