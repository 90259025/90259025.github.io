!function()
{
	"use strict";
	
	
	
	let gl = document.querySelector("#output-canvas").getContext("webgl");
	
	let canvas_size = Math.min(document.querySelector("#output-canvas").offsetWidth, document.querySelector("#output-canvas").offsetHeight);
	
	let currently_drawing = false;
	let currently_animating_parameters = false;
	
	let currently_dragging = false;
	
	let draw_start_time = 0;
	
	let mouse_x = 0;
	let mouse_y = 0;
	
	let moving_forward_keyboard = false;
	let moving_backward_keyboard = false;
	let moving_right_keyboard = false;
	let moving_left_keyboard = false;
	let moving_up_keyboard = false;
	let moving_down_keyboard = false;
	
	let moving_forward_touch = false;
	let moving_backward_touch = false;
	
	let moving_pos = true;
	
	let moving_speed = 0;
	
	let distance_to_scene = 1;
	
	
	
	let theta = 4.6601;
	let phi = 2.272;
	
	
	
	let image_size = 800;
	let image_width = 800;
	let image_height = 800;
	
	let small_image_size = 800;
	let large_image_size = 1500;
	
	let num_iterations = 32;
	
	let image_plane_center_pos = [];
	
	let forward_vec = [];
	let right_vec = [];
	let up_vec = [];
	
	let camera_pos = [.0828, 2.17, 1.8925];
	
	
	let frame = 0;
	let z_slice = -1.25;
	
	let power = 8;
	let c = [0, 0, -.8];
	let c_old = [0, 0, 0];
	let c_delta = [0, 0, 0];
	
	let rotation_angle_x = 0;
	let rotation_angle_y = 0;
	let rotation_angle_z = 0;
	
	let julia_proportion = 0;
	
	let power_old = 8;
	let power_delta = 0;
	
	let julia_proportion_old = 0;
	let julia_proportion_delta = 0;
	
	let rotation_angle_x_old = 0;
	let rotation_angle_y_old = 0;
	let rotation_angle_z_old = 0;
	let rotation_angle_x_delta = 0;
	let rotation_angle_y_delta = 0;
	let rotation_angle_z_delta = 0;
	
	let focal_length = 2;
	
	let light_pos = [0, 0, 5];
	
	let parameter_animation_frame = 0;
	
	
	
	document.querySelector("#output-canvas").setAttribute("width", image_width);
	document.querySelector("#output-canvas").setAttribute("height", image_height);
	
	document.querySelector("#dim-input").addEventListener("input", function()
	{
		change_resolution(0);
		
		window.requestAnimationFrame(draw_frame);
	});
	
	document.querySelector("#generate-high-res-image-button").addEventListener("click", prepare_download);
	
	
	
	let elements = document.querySelectorAll("#power-input, #rotation-angle-x-input, #rotation-angle-y-input, #rotation-angle-z-input, #c-x-input, #c-y-input, #c-z-input");
	
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].addEventListener("input", update_parameters);
	}
	
	document.querySelector("#randomize-parameters-button").addEventListener("click", function()
	{
		draw_frame();
	});
	document.querySelector("#switch-bulb-button").addEventListener("click", switch_bulb);
	document.querySelector("#switch-movement-button").addEventListener("click", switch_movement);
	
	
	
	setTimeout(function()
	{
		document.querySelector("#switch-bulb-button").textContent = "Switch to Juliabulb";
	}, 100);
	
	
	
	
	window.addEventListener("resize", fractals_resize);
	setTimeout(fractals_resize, 500);
	
	
	
	applet_canvases_to_resize = [document.querySelector("#output-canvas")];
	
	applet_canvas_resize_callback = function()
	{
		if (canvas_is_fullscreen)
		{
			if (Page.Layout.aspect_ratio >= 1)
			{
				image_width = image_size;
				image_height = Math.floor(image_size / Page.Layout.aspect_ratio);
			}
			
			else
			{
				image_width = Math.floor(image_size * Page.Layout.aspect_ratio);
				image_height = image_size;
			}
		}
		
		else
		{
			image_width = image_size;
			image_height = image_size;
		}
		
		
		
		canvas_size = Math.min(document.querySelector("#output-canvas").offsetWidth, document.querySelector("#output-canvas").offsetHeight);
		
		document.querySelector("#output-canvas").setAttribute("width", image_width);
		document.querySelector("#output-canvas").setAttribute("height", image_height);
		
		
		
		if (image_width >= image_height)
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, image_width / image_height);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, 1);
		}
		
		else
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, 1);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, image_width / image_height);
		}
		
		
		
		gl.uniform1i(shader_program.image_size_uniform, image_size);
		
		gl.viewport(0, 0, image_width, image_height);
		
		
		
		fractals_resize();
		
		
		
		window.requestAnimationFrame(draw_frame);
	};
	
	applet_canvas_true_fullscreen = true;
	
	set_up_canvas_resizer();
	
	
	
	init_listeners();
	
	
	
	setTimeout(setup_webgl, 500);
	
	
	
	const vertex_shader_source = `
		attribute vec3 position;
		varying vec2 uv;

		void main(void)
		{
			gl_Position = vec4(position, 1.0);

			//Interpolate quad coordinates in the fragment shader.
			uv = position.xy;
		}
	`;
	
	
	
	const frag_shader_source = `
		precision highp float;
		
		varying vec2 uv;
		
		uniform float aspect_ratio_x;
		uniform float aspect_ratio_y;
		
		uniform vec3 camera_pos;
		uniform vec3 image_plane_center_pos;
		uniform vec3 forward_vec;
		uniform vec3 right_vec;
		uniform vec3 up_vec;
		
		uniform float focal_length;
		
		uniform vec3 light_pos;
		const float light_brightness = 2.0;
		
		uniform int image_size;
		
		uniform int draw_sphere;
		
		
		
		const float clip_distance = 1000.0;
		const int max_marches = 64; //Change to 512 to eliminate flickering in animations
		const vec3 fog_color = vec3(0.0, 0.0, 0.0);
		const float fog_scaling = .2;
		const int num_iterations = 32;
		
		uniform float power;
		uniform float z_slice;
		uniform vec3 c;
		uniform float julia_proportion;
		
		vec3 color;
		
		
		
		uniform mat3 rotation_matrix;
		
		
		
		void main(void)
		{
			vec3 z = vec3(uv * 1.25, z_slice);
			
			float r = length(z);
			
			for (int iteration = 0; iteration < num_iterations; iteration++)
			{
				if (r > 16.0)
				{
					gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
					return;
				}
				
				float theta = acos(z.z / r);
				
				float phi = atan(z.y, z.x);
				
				theta *= power;
				
				phi *= power;
				
				z = pow(r, power) * vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
				
				z += c;
				
				r = length(z);
			}
			
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
		
		
		
		calculate_vectors();
		
		
		
		shader_program.aspect_ratio_x_uniform = gl.getUniformLocation(shader_program, "aspect_ratio_x");
		shader_program.aspect_ratio_y_uniform = gl.getUniformLocation(shader_program, "aspect_ratio_y");
		
		shader_program.image_size_uniform = gl.getUniformLocation(shader_program, "image_size");
		
		shader_program.camera_pos_uniform = gl.getUniformLocation(shader_program, "camera_pos");
		shader_program.image_plane_center_pos_uniform = gl.getUniformLocation(shader_program, "image_plane_center_pos");
		shader_program.forward_vec_uniform = gl.getUniformLocation(shader_program, "forward_vec");
		shader_program.right_vec_uniform = gl.getUniformLocation(shader_program, "right_vec");
		shader_program.up_vec_uniform = gl.getUniformLocation(shader_program, "up_vec");
		
		shader_program.focal_length_uniform = gl.getUniformLocation(shader_program, "focal_length");
		
		shader_program.light_pos_uniform = gl.getUniformLocation(shader_program, "light_pos");
		
		shader_program.z_slice_uniform = gl.getUniformLocation(shader_program, "z_slice");
		
		shader_program.power_uniform = gl.getUniformLocation(shader_program, "power");
		shader_program.c_uniform = gl.getUniformLocation(shader_program, "c");
		
		shader_program.rotation_matrix_uniform = gl.getUniformLocation(shader_program, "rotation_matrix");
		
		shader_program.julia_proportion_uniform = gl.getUniformLocation(shader_program, "julia_proportion");
		
		shader_program.draw_sphere_uniform = gl.getUniformLocation(shader_program, "draw_sphere");
		
		
		
		if (image_width >= image_height)
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, image_width / image_height);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, 1);
		}
		
		else
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, 1);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, image_width / image_height);
		}
		
		
		
		gl.uniform1i(shader_program.image_size_uniform, image_size);
		
		gl.uniform3fv(shader_program.camera_pos_uniform, camera_pos);
		gl.uniform3fv(shader_program.image_plane_center_pos_uniform, image_plane_center_pos);
		gl.uniform3fv(shader_program.forward_vec_uniform, forward_vec);
		gl.uniform3fv(shader_program.right_vec_uniform, right_vec);
		gl.uniform3fv(shader_program.up_vec_uniform, up_vec);
		
		gl.uniform1f(shader_program.focal_length_uniform, focal_length);
		
		gl.uniformMatrix3fv(shader_program.rotation_matrix_uniform, false, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
		
		gl.uniform3fv(shader_program.light_pos_uniform, light_pos);
		
		gl.uniform1f(shader_program.z_slice_uniform, z_slice);
		
		gl.uniform1f(shader_program.power_uniform, power);
		gl.uniform3fv(shader_program.c_uniform, c);
		
		gl.uniform1f(shader_program.julia_proportion_uniform, julia_proportion);
		
		gl.uniform1i(shader_program.draw_sphere_uniform, 0);
		
		
		
		gl.viewport(0, 0, image_width, image_height);
		
		
		
		//window.requestAnimationFrame(draw_frame);
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
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		
		
		//Uncomment to write to a sequence of frames for a Juliabulb animation.
		let link = document.createElement("a");
		
		link.download = `${frame}.png`;
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
		
		
		frame++;
		
		z_slice = (frame - 400) / 400 * 1.25;
		
		gl.uniform1f(shader_program.z_slice_uniform, z_slice);
		
		setTimeout(function()
		{
			window.requestAnimationFrame(draw_frame);
		}, 20);
		
		return;
	}
	
	
	
	function calculate_vectors()
	{
		//Here comes the serious math. Theta is the angle in the xy-plane and phi the angle down from the z-axis. We can use them get a normalized forward vector:
		forward_vec = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];
		
		//Now the right vector needs to be constrained to the xy-plane, since otherwise the image will appear tilted. For a vector (a, b, c), the orthogonal plane that passes through the origin is ax + by + cz = 0, so we want ax + by = 0. One solution is (b, -a), and that's the one that goes to the "right" of the forward vector (when looking down).
		right_vec = normalize([forward_vec[1], -forward_vec[0], 0]);
		
		//Finally, the upward vector is the cross product of the previous two.
		up_vec = cross_product(right_vec, forward_vec);
		
		
		
		distance_to_scene = distance_estimator(camera_pos[0], camera_pos[1], camera_pos[2]);
		
		
		
		focal_length = distance_to_scene / 2;
		
		//The factor we divide by here sets the fov.
		right_vec[0] *= focal_length / 2;
		right_vec[1] *= focal_length / 2;
		
		up_vec[0] *= focal_length / 2;
		up_vec[1] *= focal_length / 2;
		up_vec[2] *= focal_length / 2;
		
		
		
		image_plane_center_pos = [camera_pos[0] + focal_length * forward_vec[0], camera_pos[1] + focal_length * forward_vec[1], camera_pos[2] + focal_length * forward_vec[2]];
		
		
		
		
		gl.uniform3fv(shader_program.camera_pos_uniform, camera_pos);
		gl.uniform3fv(shader_program.image_plane_center_pos_uniform, image_plane_center_pos);
		gl.uniform3fv(shader_program.forward_vec_uniform, forward_vec);
		gl.uniform3fv(shader_program.right_vec_uniform, right_vec);
		gl.uniform3fv(shader_program.up_vec_uniform, up_vec);
		
		gl.uniform1f(shader_program.focal_length_uniform, focal_length);
	}
	
	
	
	function dot_product(vec1, vec2)
	{
		return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
	}
	
	
	
	function cross_product(vec1, vec2)
	{
		return [vec1[1] * vec2[2] - vec1[2] * vec2[1], vec1[2] * vec2[0] - vec1[0] * vec2[2], vec1[0] * vec2[1] - vec1[1] * vec2[0]];
	}
	
	
	
	function mat_mul(mat1, mat2)
	{
		return [
			[mat1[0][0]*mat2[0][0] + mat1[0][1]*mat2[1][0] + mat1[0][2]*mat2[2][0],
			mat1[0][0]*mat2[0][1] + mat1[0][1]*mat2[1][1] + mat1[0][2]*mat2[2][1],
			mat1[0][0]*mat2[0][2] + mat1[0][1]*mat2[1][2] + mat1[0][2]*mat2[2][2]
			], [
			mat1[1][0]*mat2[0][0] + mat1[1][1]*mat2[1][0] + mat1[1][2]*mat2[2][0],
			mat1[1][0]*mat2[0][1] + mat1[1][1]*mat2[1][1] + mat1[1][2]*mat2[2][1],
			mat1[1][0]*mat2[0][2] + mat1[1][1]*mat2[1][2] + mat1[1][2]*mat2[2][2]
			], [
			mat1[2][0]*mat2[0][0] + mat1[2][1]*mat2[1][0] + mat1[2][2]*mat2[2][0],
			mat1[2][0]*mat2[0][1] + mat1[2][1]*mat2[1][1] + mat1[2][2]*mat2[2][1],
			mat1[2][0]*mat2[0][2] + mat1[2][1]*mat2[1][2] + mat1[2][2]*mat2[2][2]]
			];
	}
	
	
	
	function normalize(vec)
	{
		let magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
		
		return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
	}
	
	
	
	function distance_estimator(x, y, z)
	{
		let mutable_z = [x, y, z];
		
		let r = 0.0;
		let dr = 1.0;
		
		for (let iteration = 0; iteration < num_iterations; iteration++)
		{
			r = Math.sqrt(dot_product(mutable_z, mutable_z));
			
			if (r > 16.0)
			{
				break;
			}
			
			let theta = Math.acos(mutable_z[2] / r);
			
			let phi = Math.atan2(mutable_z[1], mutable_z[0]);
			
			dr = Math.pow(r, power - 1.0) * power * dr + 1.0;
			
			theta = theta * power;
			
			phi = phi * power;
			
			let scaled_r = Math.pow(r, power);
			
			mutable_z[0] = scaled_r * Math.sin(theta) * Math.cos(phi) + ((1 - julia_proportion) * x + julia_proportion * c[0]);
			mutable_z[1] = scaled_r * Math.sin(theta) * Math.sin(phi) + ((1 - julia_proportion) * y + julia_proportion * c[1]);
			mutable_z[2] = scaled_r * Math.cos(theta) + ((1 - julia_proportion) * z + julia_proportion * c[2]);
			
			
			
			//Apply the rotation matrix.
			
			let temp_x = mutable_z[0];
			let temp_y = mutable_z[1];
			let temp_z = mutable_z[2];
			
			let mat_z = [[Math.cos(rotation_angle_z), -Math.sin(rotation_angle_z), 0], [Math.sin(rotation_angle_z), Math.cos(rotation_angle_z), 0], [0, 0, 1]];
			let mat_y = [[Math.cos(rotation_angle_y), 0, -Math.sin(rotation_angle_y)], [0, 1, 0],[Math.sin(rotation_angle_y), 0, Math.cos(rotation_angle_y)]];
			let mat_x = [[1, 0, 0], [0, Math.cos(rotation_angle_x), -Math.sin(rotation_angle_x)], [0, Math.sin(rotation_angle_x), Math.cos(rotation_angle_x)]];
			
			let mat_total = mat_mul(mat_mul(mat_z, mat_y), mat_x);
			
			mutable_z[0] = mat_total[0][0] * temp_x + mat_total[0][1] * temp_y + mat_total[0][2] * temp_z;
			mutable_z[1] = mat_total[1][0] * temp_x + mat_total[1][1] * temp_y + mat_total[1][2] * temp_z;
			mutable_z[2] = mat_total[2][0] * temp_x + mat_total[2][1] * temp_y + mat_total[2][2] * temp_z;
		}
		
		
		
		return 0.5 * Math.log(r) * r / dr;
	}
	
	
	
	function init_listeners()
	{
		document.querySelector("#output-canvas").addEventListener("mousedown", function(e)
		{
			currently_dragging = true;
			
			mouse_x = e.clientX;
			mouse_y = e.clientY;
			
			if (!currently_drawing && !currently_animating_parameters)
			{
				currently_drawing = true;
				
				draw_start_time = Date.now();
				
				image_size = small_image_size;
				
				change_resolution(image_size);
				
				window.requestAnimationFrame(draw_frame);
			}
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("mousemove", function(e)
		{
			if (currently_dragging)
			{
				e.preventDefault();
				
				
				
				if (!moving_pos)
				{
					return;
				}
				
				
				
				let new_mouse_x = e.clientX;
				let new_mouse_y = e.clientY;
				
				let mouse_x_delta = new_mouse_x - mouse_x;
				let mouse_y_delta = new_mouse_y - mouse_y;
				
				
				
				theta += mouse_x_delta / canvas_size * Math.PI;
					
				phi -= mouse_y_delta / canvas_size * Math.PI;
				
				
				
				if (theta >= 2 * Math.PI)
				{
					theta -= 2 * Math.PI;
				}
				
				else if (theta < 0)
				{
					theta += 2 * Math.PI;
				}
				
				
				
				if (phi > Math.PI - .01)
				{
					phi = Math.PI - .01;
				}
				
				else if (phi < .01)
				{
					phi = .01;
				}
				
				
				
				mouse_x = new_mouse_x;
				mouse_y = new_mouse_y;
				
				
				
				calculate_vectors();
			}
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("mouseup", function(e)
		{
			currently_dragging = false;
			
			currently_drawing = currently_dragging || moving_forward_keyboard || moving_backward_keyboard || moving_right_keyboard || moving_left_keyboard || moving_up_keyboard || moving_down_keyboard || moving_forward_touch || moving_backward_touch;
			
			if (!currently_drawing)
			{
				if (Date.now() - draw_start_time > 300)
				{
					image_size = large_image_size;
					
					change_resolution(image_size);
					
					window.requestAnimationFrame(draw_frame);
				}
			}
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("touchstart", function(e)
		{
			currently_dragging = true;
			
			mouse_x = e.touches[0].clientX;
			mouse_y = e.touches[0].clientY;
			
			if (e.touches.length === 2)
			{
				moving_forward_touch = true;
				moving_backward_touch = false;
			}
			
			else if (e.touches.length === 3)
			{
				moving_backward_touch = true;
				moving_forward_touch = false;
			}
			
			
			
			if (!currently_drawing && !currently_animating_parameters)
			{
				currently_drawing = true;
				
				draw_start_time = Date.now();
				
				image_size = small_image_size;
				
				change_resolution(image_size);
				
				window.requestAnimationFrame(draw_frame);
			}
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("touchmove", function(e)
		{
			e.preventDefault();
			
			
			
			if (!moving_pos)
			{
				return;
			}
			
			
			
			let new_mouse_x = e.touches[0].clientX;
			let new_mouse_y = e.touches[0].clientY;
			
			let mouse_x_delta = new_mouse_x - mouse_x;
			let mouse_y_delta = new_mouse_y - mouse_y;
			
			if (Math.abs(mouse_x_delta) > 20 || Math.abs(mouse_y_delta) > 20)
			{
				return;
			}
			
			
			
			theta += mouse_x_delta / canvas_size * Math.PI;
				
			phi -= mouse_y_delta / canvas_size * Math.PI;
			
			
			
			if (theta >= 2 * Math.PI)
			{
				theta -= 2 * Math.PI;
			}
			
			else if (theta < 0)
			{
				theta += 2 * Math.PI;
			}
			
			
			
			if (phi > Math.PI - .01)
			{
				phi = Math.PI - .01;
			}
			
			else if (phi < .01)
			{
				phi = .01;
			}
			
			
			
			mouse_x = new_mouse_x;
			mouse_y = new_mouse_y;
			
			
			
			calculate_vectors();
		});
		
		
		
		document.querySelector("#output-canvas").addEventListener("touchend", function(e)
		{
			if (e.touches.length === 2)
			{
				moving_forward_touch = true;
				moving_backward_touch = false;
			}
			
			else if (e.touches.length === 3)
			{
				moving_backward_touch = true;
				moving_forward_touch = false;
			}
			
			else
			{
				moving_forward_touch = false;
				moving_backward_touch = false;
				
				if (e.touches.length === 0)
				{
					currently_dragging = false;
				}
			}
			
			
			
			currently_drawing = currently_dragging || moving_forward_keyboard || moving_backward_keyboard || moving_right_keyboard || moving_left_keyboard || moving_up_keyboard || moving_down_keyboard || moving_forward_touch || moving_backward_touch;
			
			if (!currently_drawing)
			{
				if (Date.now() - draw_start_time > 300)
				{
					image_size = large_image_size;
					
					change_resolution(image_size);
					
					window.requestAnimationFrame(draw_frame);
				}
			}
		});



		document.documentElement.addEventListener("keydown", function(e)
		{
			if (document.activeElement.tagName === "INPUT" || !(e.keyCode === 87 || e.keyCode === 83 || e.keyCode === 68 || e.keyCode === 65 || e.keyCode === 16 || e.keyCode === 32))
			{
				return;
			}
			
			
			
			//W
			if (e.keyCode === 87)
			{
				moving_forward_keyboard = true;
			}
			
			//S
			else if (e.keyCode === 83)
			{
				moving_backward_keyboard = true;
			}
			
			//D
			if (e.keyCode === 68)
			{
				moving_right_keyboard = true;
			}
			
			//A
			else if (e.keyCode === 65)
			{
				moving_left_keyboard = true;
			}
			
			//Space
			else if (e.keyCode === 32)
			{
				moving_up_keyboard = true;
			}
			
			//Shift
			else if (e.keyCode === 16)
			{
				moving_down_keyboard = true;
			}
			
			
			
			if (!currently_drawing && !currently_animating_parameters)
			{
				currently_drawing = true;
				
				draw_start_time = Date.now();
				
				image_size = small_image_size;
				
				change_resolution(image_size);
				
				window.requestAnimationFrame(draw_frame);
			}
		});
		
		
		
		document.documentElement.addEventListener("keyup", function(e)
		{
			//W
			if (e.keyCode === 87)
			{
				moving_forward_keyboard = false;
			}
			
			//S
			else if (e.keyCode === 83)
			{
				moving_backward_keyboard = false;
			}
			
			//D
			if (e.keyCode === 68)
			{
				moving_right_keyboard = false;
			}
			
			//A
			else if (e.keyCode === 65)
			{
				moving_left_keyboard = false;
			}
			
			//Space
			else if (e.keyCode === 32)
			{
				moving_up_keyboard = false;
			}
			
			//Shift
			else if (e.keyCode === 16)
			{
				moving_down_keyboard = false;
			}
			
			
			currently_drawing = currently_dragging || moving_forward_keyboard || moving_backward_keyboard || moving_right_keyboard || moving_left_keyboard || moving_up_keyboard || moving_down_keyboard || moving_forward_touch || moving_backward_touch;
			
			if (!currently_drawing)
			{
				if (Date.now() - draw_start_time > 300)
				{
					image_size = large_image_size;
					
					change_resolution(image_size);
					
					window.requestAnimationFrame(draw_frame);
				}
			}
		});
	}
	
	
	
	function update_camera_parameters()
	{
		if (moving_forward_keyboard || moving_backward_keyboard || moving_right_keyboard || moving_left_keyboard || moving_up_keyboard || moving_down_keyboard || moving_forward_touch || moving_backward_touch)
		{
			moving_speed = distance_to_scene / 20;
			
			if (moving_speed < .000001)
			{
				moving_speed = .000001;
			}
			
			if (moving_speed > .02)
			{
				moving_speed = .02;
			}
			
			
			
			if (moving_pos)
			{
				if (moving_forward_keyboard || moving_forward_touch)
				{
					camera_pos[0] += moving_speed * forward_vec[0];
					camera_pos[1] += moving_speed * forward_vec[1];
					camera_pos[2] += moving_speed * forward_vec[2];
				}
				
				else if (moving_backward_keyboard || moving_backward_touch)
				{
					camera_pos[0] -= moving_speed * forward_vec[0];
					camera_pos[1] -= moving_speed * forward_vec[1];
					camera_pos[2] -= moving_speed * forward_vec[2];
				}
				
				
				
				if (moving_right_keyboard)
				{
					camera_pos[0] += moving_speed * right_vec[0] / focal_length;
					camera_pos[1] += moving_speed * right_vec[1] / focal_length;
					camera_pos[2] += moving_speed * right_vec[2] / focal_length;
				}
				
				else if (moving_left_keyboard)
				{
					camera_pos[0] -= moving_speed * right_vec[0] / focal_length;
					camera_pos[1] -= moving_speed * right_vec[1] / focal_length;
					camera_pos[2] -= moving_speed * right_vec[2] / focal_length;
				}
				
				
				
				if (moving_up_keyboard)
				{
					camera_pos[2] += moving_speed;
				}
				
				else if (moving_down_keyboard)
				{
					camera_pos[2] -= moving_speed;
				}
			}
			
			
			
			else
			{
				if (moving_forward_keyboard || moving_forward_touch)
				{
					c[0] += .2 * moving_speed * forward_vec[0];
					c[1] += .2 * moving_speed * forward_vec[1];
					c[2] += .2 * moving_speed * forward_vec[2];
				}
				
				else if (moving_backward_keyboard || moving_backward_touch)
				{
					c[0] -= .2 * moving_speed * forward_vec[0];
					c[1] -= .2 * moving_speed * forward_vec[1];
					c[2] -= .2 * moving_speed * forward_vec[2];
				}
				
				
				
				if (moving_right_keyboard)
				{
					c[0] += .2 * moving_speed * right_vec[0] / focal_length;
					c[1] += .2 * moving_speed * right_vec[1] / focal_length;
					c[2] += .2 * moving_speed * right_vec[2] / focal_length;
				}
				
				else if (moving_left_keyboard)
				{
					c[0] -= .2 * moving_speed * right_vec[0] / focal_length;
					c[1] -= .2 * moving_speed * right_vec[1] / focal_length;
					c[2] -= .2 * moving_speed * right_vec[2] / focal_length;
				}
				
				
				
				if (moving_up_keyboard)
				{
					c[2] += .2 * moving_speed;
				}
				
				else if (moving_down_keyboard)
				{
					c[2] -= .2 * moving_speed;
				}
				
				
				
				document.querySelector("#c-x-input").value = Math.round(c[0] * 1000000) / 1000000;
				document.querySelector("#c-y-input").value = Math.round(c[1] * 1000000) / 1000000;
				document.querySelector("#c-z-input").value = Math.round(c[2] * 1000000) / 1000000;
				
				
				
				gl.uniform3fv(shader_program.c_uniform, c);
			}
		
		
		
			calculate_vectors();
		}
	}
	
	
	
	function fractals_resize()
	{
		canvas_size = Math.min(document.querySelector("#output-canvas").offsetWidth, document.querySelector("#output-canvas").offsetHeight);
	}
	
	
	
	function change_resolution(new_image_size = 0)
	{
		if (new_image_size === 0)
		{
			image_size = parseInt(document.querySelector("#dim-input").value || 800);
			
			if (image_size < 200)
			{
				image_size = 200;
			}
			
			if (image_size > 2000)
			{
				image_size = 2000;
			}
			
			small_image_size = image_size;
			large_image_size = image_size * 3;
		}
		
		else
		{
			image_size = new_image_size;
		}
		
		
		
		if (canvas_is_fullscreen)
		{
			if (Page.Layout.aspect_ratio >= 1)
			{
				image_width = image_size;
				image_height = Math.floor(image_size / Page.Layout.aspect_ratio);
			}
			
			else
			{
				image_width = Math.floor(image_size * Page.Layout.aspect_ratio);
				image_height = image_size;
			}
		}
		
		
		
		document.querySelector("#output-canvas").setAttribute("width", image_width);
		document.querySelector("#output-canvas").setAttribute("height", image_height);
		
		
		
		if (image_width >= image_height)
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, image_width / image_height);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, 1);
		}
		
		else
		{
			gl.uniform1f(shader_program.aspect_ratio_x_uniform, 1);
			gl.uniform1f(shader_program.aspect_ratio_y_uniform, image_width / image_height);
		}
		
		
		
		gl.uniform1i(shader_program.image_size_uniform, image_size);
		
		gl.viewport(0, 0, image_width, image_height);
	}
	
	
	
	function update_parameters()
	{
		power_old = power;
		power_delta = (parseFloat(document.querySelector("#power-input").value || 8) || 8) - power_old;
		
		if (power_old + power_delta < 1)
		{
			power_delta = 0;
		}
		
		
		
		rotation_angle_x_old = rotation_angle_x;
		rotation_angle_y_old = rotation_angle_y;
		rotation_angle_z_old = rotation_angle_z;
		
		rotation_angle_x_delta = (parseFloat(document.querySelector("#rotation-angle-x-input").value || 0) || 0) - rotation_angle_x_old;
		rotation_angle_y_delta = (parseFloat(document.querySelector("#rotation-angle-y-input").value || 0) || 0) - rotation_angle_y_old;
		rotation_angle_z_delta = (parseFloat(document.querySelector("#rotation-angle-z-input").value || 0) || 0) - rotation_angle_z_old;
		
		
		
		c_old[0] = c[0];
		c_old[1] = c[1];
		c_old[2] = c[2];
		
		c_delta[0] = (parseFloat(document.querySelector("#c-x-input").value || 0) || 0) - c_old[0];
		c_delta[1] = (parseFloat(document.querySelector("#c-y-input").value || 0) || 0) - c_old[1];
		c_delta[2] = (parseFloat(document.querySelector("#c-z-input").value || 0) || 0) - c_old[2];
		
		
		
		julia_proportion_old = julia_proportion;
		julia_proportion_delta = 0;
		
		if (!currently_animating_parameters)
		{
			animate_parameter_change();
		}
	}
	
	
	
	function switch_bulb()
	{
		if (currently_animating_parameters)
		{
			return;
		}
		
		
		
		document.querySelector("#switch-bulb-button").style.opacity = 0;
		
		setTimeout(function()
		{
			if (julia_proportion_old === 0)
			{
				document.querySelector("#switch-bulb-button").textContent = "Switch to Mandelbulb";
			}
			
			else
			{
				document.querySelector("#switch-bulb-button").textContent = "Switch to Juliabulb";
			}
			
			document.querySelector("#switch-bulb-button").style.opacity = 1;
		}, 300);
		
		
		
		if (julia_proportion === 0)
		{
			gl.uniform3fv(shader_program.c_uniform, c);
			
			if (!moving_pos)
			{
				gl.uniform1i(shader_program.draw_sphere_uniform, 1);
			}
			
			setTimeout(function()
			{
				document.querySelector("#switch-movement-button").style.opacity = 1;
			}, 300);
		}
		
		else
		{
			moving_pos = true;
			
			gl.uniform1i(shader_program.draw_sphere_uniform, 0);
			
			document.querySelector("#switch-movement-button").style.opacity = 0;
		}
		
		
		
		julia_proportion_old = julia_proportion;
		julia_proportion_delta = 1 - 2*julia_proportion_old;
		
		power_old = power;
		power_delta = 0;
		
		rotation_angle_x_old = rotation_angle_x;
		rotation_angle_y_old = rotation_angle_y;
		rotation_angle_z_old = rotation_angle_z;
		
		rotation_angle_x_delta = 0;
		rotation_angle_y_delta = 0;
		rotation_angle_z_delta = 0;
		
		c_old[0] = c[0];
		c_old[1] = c[1];
		c_old[2] = c[2];
		
		c_delta[0] = 0;
		c_delta[1] = 0;
		c_delta[2] = 0;
		
		animate_parameter_change();
	}
	
	
	
	function switch_movement()
	{
		moving_pos = !moving_pos;
		
		
		
		document.querySelector("#switch-movement-button").style.opacity = 0;
		
		setTimeout(function()
		{
			if (moving_pos)
			{
				document.querySelector("#switch-movement-button").textContent = "Change Juliabulb";
			}
			
			else
			{
				document.querySelector("#switch-movement-button").textContent = "Move Camera";
			}
			
			document.querySelector("#switch-movement-button").style.opacity = 1;
		}, 300);
		
		
		
		if (moving_pos)
		{
			gl.uniform1i(shader_program.draw_sphere_uniform, 0);
		}
		
		else
		{
			gl.uniform1i(shader_program.draw_sphere_uniform, 1);
		}
	}
	
	
	
	function randomize_parameters(animate_change = true)
	{
		if (currently_animating_parameters)
		{
			return;
		}
		
		
		
		rotation_angle_x_old = rotation_angle_x;
		rotation_angle_y_old = rotation_angle_y;
		rotation_angle_z_old = rotation_angle_z;
		
		rotation_angle_x_delta = Math.random()*2 - 1 - rotation_angle_x_old;
		rotation_angle_y_delta = Math.random()*2 - 1 - rotation_angle_y_old;
		rotation_angle_z_delta = Math.random()*2 - 1 - rotation_angle_z_old;
		
		document.querySelector("#rotation-angle-x-input").value = Math.round((rotation_angle_x_old + rotation_angle_x_delta) * 1000000) / 1000000;
		document.querySelector("#rotation-angle-y-input").value = Math.round((rotation_angle_y_old + rotation_angle_y_delta) * 1000000) / 1000000;
		document.querySelector("#rotation-angle-z-input").value = Math.round((rotation_angle_z_old + rotation_angle_z_delta) * 1000000) / 1000000;
		
		
		
		c_old[0] = c[0];
		c_old[1] = c[1];
		c_old[2] = c[2];
		
		c_delta[0] = 0;
		c_delta[1] = 0;
		c_delta[2] = 0;
		
		
		
		julia_proportion_old = julia_proportion;
		julia_proportion_delta = 0;
		
		power_old = power;
		power_delta = 0;
		
		
		
		if (!currently_animating_parameters)
		{
			animate_parameter_change();
		}
	}
	
	
	
	function animate_parameter_change()
	{
		currently_animating_parameters = true;
		
		parameter_animation_frame = 0;
		
		window.requestAnimationFrame(draw_frame);
	}
	
	
	
	function animate_parameter_change_step()
	{
		if (image_size !== small_image_size)
		{
			image_size = small_image_size;
			
			change_resolution(image_size);
		}
		
		
		
		let t = .5 * Math.sin(Math.PI * parameter_animation_frame / 120 - Math.PI / 2) + .5;
		
		power = power_old + power_delta * t;
		julia_proportion = julia_proportion_old + julia_proportion_delta * t;
		
		rotation_angle_x = rotation_angle_x_old + rotation_angle_x_delta * t;
		rotation_angle_y = rotation_angle_y_old + rotation_angle_y_delta * t;
		rotation_angle_z = rotation_angle_z_old + rotation_angle_z_delta * t;
		
		c[0] = c_old[0] + c_delta[0] * t;
		c[1] = c_old[1] + c_delta[1] * t;
		c[2] = c_old[2] + c_delta[2] * t;
		
		
		
		let mat_z = [[Math.cos(rotation_angle_z), -Math.sin(rotation_angle_z), 0], [Math.sin(rotation_angle_z), Math.cos(rotation_angle_z), 0], [0, 0, 1]];
		let mat_y = [[Math.cos(rotation_angle_y), 0, -Math.sin(rotation_angle_y)], [0, 1, 0],[Math.sin(rotation_angle_y), 0, Math.cos(rotation_angle_y)]];
		let mat_x = [[1, 0, 0], [0, Math.cos(rotation_angle_x), -Math.sin(rotation_angle_x)], [0, Math.sin(rotation_angle_x), Math.cos(rotation_angle_x)]];
		
		let mat_total = mat_mul(mat_mul(mat_z, mat_y), mat_x);
		
		gl.uniformMatrix3fv(shader_program.rotation_matrix_uniform, false, [mat_total[0][0], mat_total[1][0], mat_total[2][0], mat_total[0][1], mat_total[1][1], mat_total[2][1], mat_total[0][2], mat_total[1][2], mat_total[2][2]]);
		
		gl.uniform1f(shader_program.power_uniform, power);
		
		gl.uniform1f(shader_program.julia_proportion_uniform, julia_proportion);
		
		gl.uniform3fv(shader_program.c_uniform, c);
		
		
		
		parameter_animation_frame++;
		
		if (parameter_animation_frame === 121)
		{
			currently_animating_parameters = false;
		}
	}
	
	
	
	function prepare_download()
	{
		let temp = image_size;
		
		image_size = parseInt(document.querySelector("#high-res-dim-input").value || 2000);
		
		document.querySelector("#output-canvas").setAttribute("width", image_size);
		document.querySelector("#output-canvas").setAttribute("height", image_size);
		
		gl.viewport(0, 0, image_size, image_size);
		
		draw_frame();
		
		
		
		let link = document.createElement("a");
		
		if (julia_proportion === 0)
		{
			link.download = "the-mandelbulb.png";
		}
		
		else
		{
			link.download = "a-juliabulb.png";
		}
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
		
		
		
		image_size = temp;
		
		document.querySelector("#output-canvas").setAttribute("width", image_size);
		document.querySelector("#output-canvas").setAttribute("height", image_size);
		
		gl.viewport(0, 0, image_size, image_size);
		
		draw_frame();
	}
}()