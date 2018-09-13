class WaterSGNode extends SGNode {

  constructor(texture, water_heightmap, children) {
    super(children);
    this.node = new MaterialSGNode(
      new AdvancedTextureSGNode(texture, 0, 'u_tex1', //texture color of the water
      new AdvancedTextureSGNode(water_heightmap, 1, 'u_height', //heightmap for wave generation
      new EnvironmentSGNode(envcubetexture,4,false, //for reflecting the environment
      new RenderSGNode(makePlane())
    ))));
  }

  render(context)
  {
    //pass values to the shader
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_time'), context.timeInMilliseconds / 3000);
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_isWater'), true);
    this.node.render(context);
    //disconnect from the shader
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_isWater'), false);
  }
}
