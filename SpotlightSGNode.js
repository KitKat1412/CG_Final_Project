class SpotlightSGNode extends TransformationSGNode {

  constructor(position, children) {
    super(null, children);
    this.position = position || [0, 0, 0];
    this.ambient = [0.5, 0.5, 0.5, 1];
    this.diffuse = [1, 1, 1, 1];
    this.specular = [0.8, 0.8, 0.8, 1];
    this.axis = [0.0, -1.0, 0.0];
    this.angle = 0.5;
    //uniform name
    this.uniform = 'u_light2';

    this._worldPosition = null;
  }

  setLightUniforms(context) {
    const gl = context.gl;
    //no materials in use
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'.ambient'))) {
      return;
    }
    //otherwise, use material characteristics
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.ambient'), this.ambient);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.diffuse'), this.diffuse);
    gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.specular'), this.specular);
    gl.uniform3fv(gl.getUniformLocation(context.shader, this.uniform+'Axis'), this.axis);
    gl.uniform1f(gl.getUniformLocation(context.shader, this.uniform+'Angle'), this.angle);
  }

  setLightPosition(context) {
    const gl = context.gl;
    //no objects in use
    if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'Pos'))) {
      return;
    }
    //otherwise, set the position of the light onto an object
    const position = this._worldPosition || this.position;
    gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform+'Pos'), position[0], position[1], position[2]);
  }

  computeLightPosition(context) {
    //transform with the current model view matrix
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const original = this.position;
    const position =  vec4.transformMat4(vec4.create(), vec4.fromValues(original[0], original[1],original[2], 1), modelViewMatrix);

    this._worldPosition = position;
  }

  /**
   * set the light uniforms without updating the last light position
   */
  setLight(context) {
    this.setLightPosition(context);
    this.setLightUniforms(context);
  }

  render(context) {
    this.computeLightPosition(context);
    this.setLight(context);

    //since this a transformation node update the matrix according to my position
    this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);
    //render children
    super.render(context);
  }
}
