!function()
{
	"use strict";
	
	
	
	let gl = document.querySelector("#output-canvas").getContext("webgl");
	
	let canvas_size = document.querySelector("#output-canvas").offsetWidth;
	
	let currently_dragging = false;
	
	let mouse_x = 0;
	let mouse_y = 0;
	
	let moving_forward = false;
	let moving_backward = false;
	let moving_right = false;
	let moving_left = false;
	
	let moving_speed = 0;
	let sprinting = false;
	
	
	
	let theta = 3 * Math.PI / 2;
	let phi = Math.PI / 2;
	
	
	
	let image_size = 100;
	
	let image_plane_center_pos = [0, 1, 1];
	
	let forward_vec = [];
	let right_vec = [];
	let up_vec = [];
	
	let camera_pos = [];
	
	
	
	const focal_length = 2;
	const clip_distance = 100;
	const max_marches = 64;
	const epsilon = .01;
	const fog_color = [.75, .75, 1, 1];
	const num_rays_per_aa_pixel = 1;
	
	
	
	calculate_vectors();
	
	
	
	let light_pos = [5, 5, 5];
	let light_brightness = 1;
	
	let shadow_sharpness = 10;
	
	
	
	//An object consists of a distance estimator, a color, and a reflectance.
	let objects = [[DE_sierpinski_tetrahedron, [1, 0, 0], 1], [DE_plane, [0, .5, 0], 1]];
	
	
	
	document.querySelector("#output-canvas").setAttribute("width", image_size);
	document.querySelector("#output-canvas").setAttribute("height", image_size);
	
	document.querySelector("#download-button").addEventListener("click", prepare_download);
	
	window.addEventListener("resize", fractals_resize);
	setTimeout(fractals_resize, 500);
	
	init_listeners();
	
	
	
	const vertex_shader_source = `
		attribute vec3 position;
		varying vec2 uv;

		void main(void)
		{
			gl_Position = vec4(position, 1.0);

			// Interpolate quad coordinates in the fragment shader
			uv = position.xy;
		}
	`;
	
	const frag_shader_source = `
		precision mediump float;
		
		varying vec2 uv;
		
		uniform vec3 camera_pos;
		uniform vec3 forward_vec;
		uniform vec3 right_vec;
		uniform vec3 up_vec;
		
		uniform int image_size;
		
		
		
		//Constants that WebGL doesn't like being constants
		uniform float focal_length;
		
		uniform float clip_distance;
		
		uniform int max_marches;
		uniform float epsilon;
		uniform vec4 fog_color;
		
		uniform int num_rays_per_aa_pixel;
		
		
		
		void main()
		{
			//vec3 start_pos = camera_pos;
			//vec3 ray_direction_vec = normalize(forward_vec * focal_length + right_vec * uv.x + up_vec * uv.y);
			
			//vec4 color = compute_color(start_pos, ray_direction_vec);
			
			vec4 color = vec4(1, 0, 0, 1);
			
			gl_FragColor = vec4(color.xyz, 1);
		}
	`;
	
	
	
	
	let shader_program = null;
	
	function setup_webgl()
	{
		let vertex_shader = load_shader(gl, gl.VERTEX_SHADER, vertex_shader_source);
		
		let frag_shader = load_shader(gl, gl.FRAGMENT_SHADER, frag_shader_source);
		
		shader_program = gl.createProgram();
		
		gl.attachShader(shader_program, vertex_shader);
		gl.attachShader(shader_program, frag_shader);
		gl.linkProgram(shader_program);
		
		if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS))
		{
			console.log(`Couldn't link shader program: ${gl.getShaderInfoLog(shader)}`);
			gl.deleteProgram(shader_program);
		}
		
		
		
		gl.useProgram(shader_program);
		
		
		
		let quad = [-1, -1, 0,   -1, 1, 0,   1, -1, 0,   1, 1, 0];
		
		
		
		let position_buffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
		
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);
		
		shader_program.position_attribute = gl.getAttribLocation(shader_program, "position");
		
		gl.enableVertexAttribArray(shader_program.position_attribute);
		
		gl.vertexAttribPointer(shader_program.position_attribute, 3, gl.FLOAT, false, 0, 0);
		
		
		
		shader_program.image_size_uniform = gl.getUniformLocation(shader_program, "image_size");
		shader_program.camera_pos_uniform = gl.getUniformLocation(shader_program, "camera_pos");
		shader_program.forward_vec_uniform = gl.getUniformLocation(shader_program, "forward_vec");
		shader_program.right_vec_uniform = gl.getUniformLocation(shader_program, "right_vec");
		shader_program.up_vec_uniform = gl.getUniformLocation(shader_program, "up_vec");
		
		
		
		//Set constants.
		shader_program.focal_length_uniform = gl.getUniformLocation(shader_program, "focal_length");
		shader_program.clip_distance_uniform = gl.getUniformLocation(shader_program, "clip_distance");
		shader_program.max_marches_uniform = gl.getUniformLocation(shader_program, "max_marches");
		shader_program.epsilon_uniform = gl.getUniformLocation(shader_program, "epsilon");
		shader_program.fog_color_uniform = gl.getUniformLocation(shader_program, "fog_color");
		shader_program.num_rays_per_aa_pixel_uniform = gl.getUniformLocation(shader_program, "num_rays_per_aa_pixel");
		
		gl.uniform1f(shader_program.focal_length_uniform, focal_length);
		gl.uniform1f(shader_program.clip_distance_uniform, clip_distance);
		gl.uniform1i(shader_program.max_marches_uniform, max_marches);
		gl.uniform1f(shader_program.epsilon_uniform, epsilon);
		gl.uniform4fv(shader_program.fog_color_uniform, fog_color);
		gl.uniform1i(shader_program.num_rays_per_aa_pixel_uniform, num_rays_per_aa_pixel);
		
		
		
		draw_frame();
	}
	
	
	
	function load_shader(gl, type, source)
	{
		let shader = gl.createShader(type);
		
		gl.shaderSource(shader, source);
		
		gl.compileShader(shader);
		
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log(`Couldn't load shader: ${gl.getProgramInfoLog(shaderProgram)}`);
			gl.deleteShader(shader);
		}
		
		return shader;
	}
	
	
	
	function draw_frame()
	{
		gl.uniform1i(shader_program.image_size_uniform, image_size);
		gl.uniform3fv(shader_program.camera_pos_uniform, camera_pos);
		gl.uniform3fv(shader_program.forward_vec_uniform, forward_vec);
		gl.uniform3fv(shader_program.right_vec_uniform, right_vec);
		gl.uniform3fv(shader_program.up_vec_uniform, up_vec);
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	
	
	
	load_script("/scripts/gl-matrix.min.js")
	
	.then(function()
	{
		setup_webgl();
	});
	
	
	
	
	
	function calculate_vectors()
	{
		//Here comes the serious math. Theta is the angle in the xy-plane and phi the angle down from the z-axis. We can use them get a normalized forward vector:
		forward_vec = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];
		
		//Now the right vector needs to be constrained to the xy-plane, since otherwise the image will appear tilted. For a vector (a, b, c), the orthogonal plane that passes through the origin is ax + by + cz = 0, so we want ax + by = 0. One solution is (b, -a), and that's the one that goes to the "right" of the forward vector (when looking down).
		right_vec = normalize([forward_vec[1], -forward_vec[0], 0]);
		
		//Finally, the upward vector is the cross product of the previous two.
		up_vec = cross_product(right_vec, forward_vec);
		
		
		
		camera_pos = [image_plane_center_pos[0] - focal_length * forward_vec[0], image_plane_center_pos[1] - focal_length * forward_vec[1], image_plane_center_pos[2] - focal_length * forward_vec[2]];
	}
	
	
	
	function a()
	{
		let anti_aliasing_iteration_threshhold = 0;
		
		
		
		//First, just get a color for every pixel.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				let result = calculate_pixel(row, col, false);
				
				image[row][col] = result[0];
				num_iterations_required[row][col] = result[1];
				
				anti_aliasing_iteration_threshhold += result[1];
			}
		}
		
		
		
		anti_aliasing_iteration_threshhold /= (image_size * image_size);
		
		//Then mark which pixels need anti-aliasing.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				if (num_iterations_required[row][col] > anti_aliasing_iteration_threshhold)
				{
					pixels_to_anti_alias[row][col] = true;
					
					if (row !== 0)
					{
						pixels_to_anti_alias[row - 1][col] = true;
					}
					
					if (col !== 0)
					{
						pixels_to_anti_alias[row][col - 1] = true;
					}
					
					if (row !== image_size - 1)
					{
						pixels_to_anti_alias[row + 1][col] = true;
					}
					
					if (col !== image_size - 1)
					{
						pixels_to_anti_alias[row][col + 1] = true;
					}
				}
			}
		}
		
		
		
		//Now perform anti-aliasing on the ones that seem to be near an edge.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				if (pixels_to_anti_alias[row][col])
				{
					for (let ray_index = 1; ray_index < num_rays_per_pixel; ray_index++)
					{
						let result = calculate_pixel(row, col, true);
						
						image[row][col][0] += result[0][0];
						image[row][col][1] += result[0][1];
						image[row][col][2] += result[0][2];
					}
					
					image[row][col][0] /= num_rays_per_pixel;
					image[row][col][1] /= num_rays_per_pixel;
					image[row][col][2] /= num_rays_per_pixel;
				}
			}
		}
		
		
		
		//Finally, draw the image.
		let img_data = ctx.getImageData(0, 0, image_size, image_size);
		let data = img_data.data;
		
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				let index = (4 * row * image_size) + (4 * col);
				
				data[index] = image[row][col][0] * 255;
				data[index + 1] = image[row][col][1] * 255;
				data[index + 2] = image[row][col][2] * 255;
				data[index + 3] = 255;
			}
		}
		
		ctx.putImageData(img_data, 0, 0);
	}
	
	
	
	function calculate_pixel(row, col, noise)
	{
		//(u, v) gives local coordinates on the image plane (-1 <= u, v <= 1)
		let u = col / image_size * 2 - 1;
		let v = 1 - row / image_size * 2;
		
		if (noise)
		{
			u += Math.random() * (2 / image_size);
			v += Math.random() * (2 / image_size);
		}
		
		//(x, y, z) gives global coordinates.
		let start_x = image_plane_center_pos[0] + image_plane_right_vec[0] * u + image_plane_up_vec[0] * v;
		let start_y = image_plane_center_pos[1] + image_plane_right_vec[1] * u + image_plane_up_vec[1] * v;
		let start_z = image_plane_center_pos[2] + image_plane_right_vec[2] * u + image_plane_up_vec[2] * v;
		
		
		
		//Having the camera recessed from the image plane creates perspective, so every ray will go in a different direction.
		let ray_direction_vec = [start_x - camera_pos[0], start_y - camera_pos[1], start_z - camera_pos[2]];
		
		let magnitude = Math.sqrt(ray_direction_vec[0] * ray_direction_vec[0] + ray_direction_vec[1] * ray_direction_vec[1] + ray_direction_vec[2] * ray_direction_vec[2]);
		
		ray_direction_vec[0] /= magnitude;
		ray_direction_vec[1] /= magnitude;
		ray_direction_vec[2] /= magnitude;
		
		
		
		//The coefficient on the march direction vector.
		let t = 0;
		
		let iteration = 0;
		
		while (iteration < max_iterations)
		{
			let x = start_x + t * ray_direction_vec[0];
			let y = start_y + t * ray_direction_vec[1];
			let z = start_z + t * ray_direction_vec[2];
			
			
			
			//Get the distance to the scene.
			let result = distance_estimator(x, y, z);
			
			let distance = result[0];
			let object_index = result[1];
			
			//If we barely moved, we're probably at an object.
			if (distance < epsilon)
			{
				//Shade the point.
				return [calculate_shading(x, y, z, object_index), iteration];
			}
			
			else if (distance > clipping_distance)
			{
				return [[fog_color[0], fog_color[1], fog_color[2]], iteration];
			}
			
			
			
			t += distance;
			
			iteration++;
		}
		
		
		
		return [[fog_color[0], fog_color[1], fog_color[2]], iteration];
	}
	
	
	
	function distance_estimator(x, y, z)
	{
		let min_distance = Infinity;
		let min_index = 0;
		
		
		
		for (let i = 0; i < objects.length; i++)
		{
			let distance = objects[i][0](x, y, z);
			
			if (distance < min_distance)
			{
				min_distance = distance;
				min_index = i;
			}
		}
		
		
		
		return [min_distance, min_index];
	}
	
	
	
	function calculate_shading(x, y, z, object_index)
	{
		let normal = get_normal(x, y, z);
		
		let light_direction = normalize([light_pos[0] - x, light_pos[1] - y, light_pos[2] - z]);
		
		let light_intensity = light_brightness * dot_product(normal, light_direction) * calculate_shadow(x, y, z, object_index, light_direction);
		
		
		
		let color = [light_intensity * objects[object_index][2] * objects[object_index][1][0], light_intensity * objects[object_index][2] * objects[object_index][1][1], light_intensity * objects[object_index][2] * objects[object_index][1][2]];
		
		
		
		//Apply fog.
		let distance_from_camera = Math.sqrt((x-image_plane_center_pos[0])*(x-image_plane_center_pos[0]) + (y-image_plane_center_pos[1])*(y-image_plane_center_pos[1]) + (z-image_plane_center_pos[2])*(z-image_plane_center_pos[2]));
		
		let fog_amount = 1 - Math.exp(-distance_from_camera * fog_scaling);
		
		return [(1 - fog_amount) * color[0] + fog_amount * fog_color[0], (1 - fog_amount) * color[1] + fog_amount * fog_color[1], (1 - fog_amount) * color[2] + fog_amount * fog_color[2]];
	}
	
	
	
	function calculate_shadow(start_x, start_y, start_z, start_object_index, light_direction)
	{
		let t = epsilon;
		
		let max_t = Math.sqrt((start_x - light_pos[0])*(start_x - light_pos[0]) + (start_y - light_pos[1])*(start_y - light_pos[1]) + (start_z - light_pos[2])*(start_z - light_pos[2]));
		
		let shadow_amount = 1;
		
		let iteration = 0;
		let max_shadow_iterations = 50;
		
		
		
		while (t < max_t && iteration < max_shadow_iterations)
		{
			let x = start_x + t * light_direction[0];
			let y = start_y + t * light_direction[1];
			let z = start_z + t * light_direction[2];
			
			
			
			//Get the distance to the scene.
			let result = distance_estimator(x, y, z);
			
			let distance = result[0];
			let object_index = result[1];
			
			//If we barely moved, we're probably at an object.
			if (distance < epsilon / 4)
			{
				//This point is totally shadowed.
				return 0;
			}
			
			shadow_amount = Math.min(shadow_amount, shadow_sharpness * distance / t);
			
			t += distance;
			
			iteration++;
		}
		
		
		
		return shadow_amount;
	}
	
	
	
	//Approxmiates the distance estimator's gradient, which will be the surface normal.
	function get_normal(x, y, z)
	{
		let e = .00001;
		
		let base = distance_estimator(x, y, z)[0];
		
		return normalize([(distance_estimator(x + e, y, z)[0] - base) / e, (distance_estimator(x, y + e, z)[0] - base) / e, (distance_estimator(x, y, z + e)[0] - base) / e]);
	}
	
	
	
	function dot_product(vec1, vec2)
	{
		return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
	}
	
	
	
	function cross_product(vec1, vec2)
	{
		return [vec1[1] * vec2[2] - vec1[2] * vec2[1], vec1[2] * vec2[0] - vec1[0] * vec2[2], vec1[0] * vec2[1] - vec1[1] * vec2[0]];
	}
	
	
	
	function normalize(vec)
	{
		let magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
		
		return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
	}
	
	
	
	function DE_sierpinski_tetrahedron(x, y, z)
	{
		let vertices = [[0, 0, 2], [0, -2, 0], [-2, 0, 0], [-2, -2, 2]];
		
		let num_iterations = 10;
		
		//We'll find the closest vertex, scale everything by a factor of 2 centered on that vertex (so that we don't need to recalculate the vertices), and repeat.
		for (let iteration = 0; iteration < num_iterations; iteration++)
		{
			let min_distance = Infinity;
			let closest_vertex = 0;
			
			for (let i = 0; i < 4; i++)
			{
				//No need to take a square root if we're just trying to find a minimum.
				let distance = (x - vertices[i][0])*(x - vertices[i][0]) + (y - vertices[i][1])*(y - vertices[i][1]) + (z - vertices[i][2])*(z - vertices[i][2]);
				
				if (distance < min_distance)
				{
					min_distance = distance;
					closest_vertex = i;
				}
			}
			
			
			
			//This one takes a fair bit of thinking to get. Picture the 2d case, and how stretching "from the origin" doesn't have anything to do with the origin except its fixed point. What's happening here is that we're stretching from a vertex, but since we never scale the vertices, the four new ones are the four closest to the vertex we scaled from. Now (x, y, z) will get farther and farther away from the origin, but that makes sense -- we're really just zooming in on the tetrahedron.
			x = 2*x - vertices[closest_vertex][0];
			y = 2*y - vertices[closest_vertex][1];
			z = 2*z - vertices[closest_vertex][2];
		}
		
		
		
		//So at this point we've scaled up by 2x a total of num_iterations times. The final distance is therefore:
		return Math.sqrt(x*x + y*y + z*z) * Math.pow(2, -num_iterations);
	}
	
	function DE_plane(x, y, z)
	{
		return dot_product([x, y, z], [0, 0, 1]) + 1;
	}
	
	
	
	function init_listeners()
	{
		document.querySelector("#output-canvas").addEventListener("mousedown", function(e)
		{
			currently_dragging = true;
			
			mouse_x = e.clientX;
			mouse_y = e.clientY;
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("mousemove", function(e)
		{
			if (currently_dragging)
			{
				e.preventDefault();
				
				
				
				let new_mouse_x = e.clientX;
				let new_mouse_y = e.clientY;
				
				let mouse_x_delta = new_mouse_x - mouse_x;
				let mouse_y_delta = new_mouse_y - mouse_y;
				
				
				
				theta += mouse_x_delta / canvas_size * Math.PI;
				
				if (theta >= 2 * Math.PI)
				{
					theta -= 2 * Math.PI;
				}
				
				else if (theta < 0)
				{
					theta += 2 * Math.PI;
				}
				
				
				
				phi -= mouse_y_delta / canvas_size * Math.PI;
				
				if (phi >= Math.PI)
				{
					phi = Math.PI
				}
				
				else if (phi < 0)
				{
					phi = 0;
				}
				
				
				
				mouse_x = new_mouse_x;
				mouse_y = new_mouse_y;
				
				
				
				calculate_vectors();
				
				draw_frame();
			}
		});
		
		
		
		document.documentElement.addEventListener("mouseup", function(e)
		{
			currently_dragging = false;
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("touchstart", function(e)
		{
			mouse_x = e.touches[0].clientX;
			mouse_y = e.touches[0].clientY;
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("touchmove", function(e)
		{
			e.preventDefault();
			
			
			
			let new_mouse_x = e.touches[0].clientX;
			let new_mouse_y = e.touches[0].clientY;
			
			let mouse_x_delta = new_mouse_x - mouse_x;
			let mouse_y_delta = new_mouse_y - mouse_y;
			
			
			
			theta += mouse_x_delta / canvas_size * Math.PI;
			
			if (theta >= 2 * Math.PI)
			{
				theta -= 2 * Math.PI;
			}
			
			else if (theta < 0)
			{
				theta += 2 * Math.PI;
			}
			
			
			
			phi -= mouse_y_delta / canvas_size * Math.PI;
			
			if (phi >= Math.PI)
			{
				phi = Math.PI
			}
			
			else if (phi < 0)
			{
				phi = 0;
			}
			
			
			
			mouse_x = new_mouse_x;
			mouse_y = new_mouse_y;
			
			
			
			calculate_vectors();
			
			draw_frame();
		});
		
		
		
		document.documentElement.addEventListener("keydown", function(e)
		{
			//W
			if (e.keyCode === 87)
			{
				moving_forward = true;
			}
			
			//S
			else if (e.keyCode === 83)
			{
				moving_backward = true;
			}
			
			//D
			if (e.keyCode === 68)
			{
				moving_right = true;
			}
			
			//A
			else if (e.keyCode === 65)
			{
				moving_left = true;
			}
			
			//Shift
			if (e.keyCode === 16)
			{
				sprinting = true;
			}
		});
		
		
		
		document.documentElement.addEventListener("keyup", function(e)
		{
			//W
			if (e.keyCode === 87)
			{
				moving_forward = false;
			}
			
			//S
			else if (e.keyCode === 83)
			{
				moving_backward = false;
			}
			
			//D
			if (e.keyCode === 68)
			{
				moving_right = false;
			}
			
			//A
			else if (e.keyCode === 65)
			{
				moving_left = false;
			}
			
			//Shift
			if (e.keyCode === 16)
			{
				sprinting = false;
			}
		});
		
		
		
		setInterval(function()
		{
			if (moving_forward || moving_backward || moving_right | moving_left)
			{
				moving_speed = distance_estimator(image_plane_center_pos[0], image_plane_center_pos[1], image_plane_center_pos[2])[0] / 30;
				
				if (sprinting)
				{
					moving_speed *= 3;
				}
				
				
				
				if (moving_forward)
				{
					image_plane_center_pos[0] += moving_speed * image_plane_forward_vec[0];
					image_plane_center_pos[1] += moving_speed * image_plane_forward_vec[1];
					image_plane_center_pos[2] += moving_speed * image_plane_forward_vec[2];
				}
				
				else if (moving_backward)
				{
					image_plane_center_pos[0] -= moving_speed * image_plane_forward_vec[0];
					image_plane_center_pos[1] -= moving_speed * image_plane_forward_vec[1];
					image_plane_center_pos[2] -= moving_speed * image_plane_forward_vec[2];
				}
				
				
				
				if (moving_right)
				{
					image_plane_center_pos[0] += moving_speed * image_plane_right_vec[0];
					image_plane_center_pos[1] += moving_speed * image_plane_right_vec[1];
					image_plane_center_pos[2] += moving_speed * image_plane_right_vec[2];
				}
				
				else if (moving_left)
				{
					image_plane_center_pos[0] -= moving_speed * image_plane_right_vec[0];
					image_plane_center_pos[1] -= moving_speed * image_plane_right_vec[1];
					image_plane_center_pos[2] -= moving_speed * image_plane_right_vec[2];
				}
			
			
			
				calculate_vectors();
				
				draw_frame();
			}
		}, 8);
	}
	
	
	
	function fractals_resize()
	{
		canvas_size = document.querySelector("#output-canvas").offsetWidth;
	}
	
	
	
	function prepare_download()
	{
		let link = document.createElement("a");
		
		link.download = "gravner-griffeath-snowflakes.png";
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
	}
}()