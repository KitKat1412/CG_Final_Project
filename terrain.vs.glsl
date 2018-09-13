#version 300 es

precision mediump float;
//input object variables
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;
//world variables
uniform mat4 u_modelView;
uniform mat4 u_model;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat3 u_invView;

uniform vec3 u_lightPos;
uniform vec3 u_light2Pos;
//height value from heightmap
uniform sampler2D u_height;

uniform bool u_isTerrain;
uniform bool u_isWater;

uniform float u_time;
//output
out vec3 v_normalVec;
out vec3 v_eyeVec;
out vec3 v_cameraRayVec;
out vec3 v_lightVec;
out vec3 v_light2Vec;
out vec3 v_light2WVec;
//final height value of a point on the plane
out float v_height;

out vec2 v_texCoord;

//make a wave
vec4 renderWater(vec2 uv) {
    //alter the texCoord based on time
    //animates the texture so simulate wave movement
    vec2 uv0 = uv/103.0+vec2(u_time/17.0, u_time/29.0);
    vec2 uv1 = uv/107.0-vec2(u_time/-19.0, u_time/31.0);
    vec2 uv2 = uv/vec2(897.0, 983.0)+vec2(u_time/101.0, u_time/97.0);
    vec2 uv3 = uv/vec2(991.0, 877.0)-vec2(u_time/109.0, u_time/-113.0);
    //assign height based on the adjusted heightmap values
    vec4 noise = texture(u_height, uv0) +
                 texture(u_height, uv1) +
                 texture(u_height, uv2) +
                 texture(u_height, uv3);
    return noise * 0.1;
}
//make a hill
//uses 5 points; 4 edge points and 1 middle
vec4 renderTerrain() {
	const vec2 size = vec2(2.0,0.0);
	const ivec3 off = ivec3(-1,0,1);

	vec2 texCoord = a_texCoord / 10.0;
  //find height value of middle point based on heightmap
	vec4 val11 = texture(u_height, texCoord);
  //distance between that value and origin
	float s11 = sqrt(val11.x*val11.x + val11.y*val11.y + val11.z*val11.z) * 3.0;
  //with offset
	if (s11 < 0.3) {
		s11 = s11 - 1.0;
	}
  //final height value
	v_height = s11;
  //the height value of the edge points with offset
	vec4 val01 = textureOffset(u_height, texCoord, off.xy);
	vec4 val21 = textureOffset(u_height, texCoord, off.zy);
	vec4 val10 = textureOffset(u_height, texCoord, off.yx);
	vec4 val12 = textureOffset(u_height, texCoord, off.yz);
  //distance between that value and origin
  //for use in normal vector
	float s01 = sqrt(val01.x*val01.x + val01.y*val01.y + val01.z*val01.z) * 3.0;
	float s21 = sqrt(val21.x*val21.x + val21.y*val21.y + val21.z*val21.z) * 3.0;
	float s10 = sqrt(val10.x*val10.x + val10.y*val10.y + val10.z*val10.z) * 3.0;
	float s12 = sqrt(val12.x*val12.x + val12.y*val12.y + val12.z*val12.z) * 3.0;
  //convert those distances to a vector and normalize
  //for use in v_normalVec
	vec3 va = normalize(vec3(size.xy,s21-s01));
	vec3 vb = normalize(vec3(size.yx,s12-s10));

	vec3 newPosition = a_position + a_normal * s11;
	vec4 eyePosition = u_modelView * vec4(newPosition, 1);

	v_normalVec = u_normalMatrix * cross(va,vb);
  //light positions and illumination vectors
	v_eyeVec = -eyePosition.xyz;
  v_light2WVec = u_invView * (eyePosition.xyz - u_light2Pos);
	v_lightVec = u_lightPos - eyePosition.xyz;
  v_light2Vec = u_light2Pos - eyePosition.xyz;

	v_texCoord = a_texCoord;

	return u_projection * eyePosition;
}

void main() {
	if (u_isTerrain) {
		gl_Position = renderTerrain();
	} else {
		vec3 newPosition = a_position;
		if (u_isWater) {
			vec4 wave = renderWater(a_texCoord * 10.0);
			newPosition += sqrt(wave.x*wave.x + wave.y*wave.y + wave.z*wave.z) * a_normal - 0.4;
		}

	  vec4 eyePosition = u_modelView * vec4(newPosition, 1);
    //light positions and illumination vectors
		v_eyeVec = -eyePosition.xyz;
    v_light2WVec = u_invView * (eyePosition.xyz - u_light2Pos);
		v_lightVec = u_lightPos - eyePosition.xyz;
    v_light2Vec = u_light2Pos - eyePosition.xyz;
    //texture color
		v_texCoord = a_texCoord;

		v_cameraRayVec = u_invView * eyePosition.xyz;
		v_normalVec = u_invView * u_normalMatrix * a_normal;

	  gl_Position = u_projection * eyePosition;
	}
}
