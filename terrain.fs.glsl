#version 300 es

precision mediump float;

/**
 * definition of a material structure containing common properties
 */
struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};
/**
 * definition of the light properties related to material properties
 */
struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

//illumination related variables
uniform Material u_material;

uniform Light u_light;
uniform Light u_light2;

uniform vec3 u_light2Axis;
uniform float u_light2Angle;

in vec3 v_normalVec;
in vec3 v_eyeVec;
in vec3 v_lightVec;
in vec3 v_light2Vec;
in vec3 v_light2WVec;
in vec3 v_cameraRayVec;
in float v_height;

//texture related variables
in vec2 v_texCoord;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;
uniform samplerCube u_texCube;

out vec4 fragColor;

uniform float u_time;

uniform bool u_isWater;
uniform bool u_isTerrain;
uniform bool u_isSkybox;

void main (void) {
	vec4 textureColor;

	//shader function for the environmentmap
	if (u_isSkybox && !u_isWater) {
		vec3 cameraRayVec = normalize(v_cameraRayVec);
		fragColor = texture(u_texCube, cameraRayVec);
		return;
	}

	//texture color for the terrain heightmap
	if (u_isTerrain) {
		if (v_height < -0.1) {//bottom texture
			textureColor = texture(u_tex2, v_texCoord);
		} else if (v_height < 0.3) {//blend bottom and middle textures
			textureColor = 2.5 * ((0.3 - v_height) * texture(u_tex2, v_texCoord) + (v_height + 0.1) * texture(u_tex1, v_texCoord));
		} else if (v_height < 2.0) {//middle texture
		 textureColor = texture(u_tex1, v_texCoord);
		} else if (v_height < 2.5) {//blend middle and top texture
			textureColor = 2.0 * ((2.5 - v_height) * texture(u_tex1, v_texCoord) + (v_height - 2.0) * texture(u_tex3, v_texCoord));
		} else {//top texture
		 textureColor = texture(u_tex3, v_texCoord);
		}
		//texture color for water heightmap
	} else if (u_isWater) {
		vec3 normalVec = normalize(v_normalVec);
		vec3 cameraRayVec = normalize(v_cameraRayVec);
		//get the texture color of the skybox
		vec3 texCoords = reflect(cameraRayVec, normalVec);
		//blend texure of the water with reflection of skybox
		textureColor = 0.7 * texture(u_texCube, texCoords) + 0.3 * texture(u_tex1, v_texCoord);
	} else {//color the fragment with whatever other texture is given
		textureColor = texture(u_tex1, v_texCoord);
	}

	//compute lighting properties for general light source
	vec3 normalVec = normalize(v_normalVec);
	vec3 eyeVec = normalize(v_eyeVec);
	vec3 lightVec = normalize(v_lightVec);

	//compute diffuse term
	float diffuse = max(dot(normalVec, lightVec),0.0);
	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow(max(dot(reflectVec, eyeVec), 0.0), u_material.shininess);

	//phong shader properties with texture support
	vec4 c_em   = u_material.emission;
	vec4 c_amb  = clamp(u_light.ambient * u_material.ambient * textureColor, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * u_light.diffuse * u_material.diffuse * textureColor, 0.0, 1.0);
	vec4 c_spec = clamp(spec * u_light.specular * u_material.specular, 0.0, 1.0);

	//additional phong shader for spotlight
	float angle = dot(normalize(v_light2WVec), normalize(u_light2Axis));

	if (angle > u_light2Angle - 0.1) {
		float multiplier = 1.0;
		if (angle < u_light2Angle) {
			multiplier = 1.0 - 10.0 * (u_light2Angle - angle);
		}

		vec3 light2Vec = normalize(v_light2Vec);
		//compute diffuse term for spotlight
		float diffuse = max(dot(normalVec, light2Vec),0.0);
		//computer reflection for spotlight
		vec3 reflectVec = reflect(-light2Vec, normalVec);
		//phong shader properties for spotlight
		c_amb  += clamp(multiplier * u_light2.ambient * u_material.ambient * textureColor, 0.0, 1.0);
		c_diff += clamp(multiplier * diffuse * u_light2.diffuse * u_material.diffuse * textureColor, 0.0, 1.0);
	}

	if (u_isWater) {//if water, make transparent
		fragColor = vec4((c_diff + c_amb + c_spec + c_em).rgb, 0.8);
	} else {
		fragColor = c_diff + c_amb + c_spec + c_em;
	}
}
