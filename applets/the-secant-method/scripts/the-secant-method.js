!function()
{
	"use strict";
	
	
	
	let image_size = 500;
	let image_width = 500;
	let image_height = 500;
	
	let a = [1, 0];
	let c = [0, 0];
	
	let current_roots = [];
	
	let gl = document.querySelector("#newtons-method-plot").getContext("webgl");
	
	let draw_another_frame = false;
	let need_to_restart = true;
	
	
	
	let root_markers = [];
	
	let active_marker = -1;
	
	//Used with the root setter.
	let last_active_marker = -1;
	
	let root_selector_width = document.querySelector("#root-selector").offsetWidth;
	let root_selector_height = document.querySelector("#root-selector").offsetHeight;
	let root_selector_size = Math.min(root_selector_width, root_selector_height);
	
	let root_marker_radius = 17.5;
	
	
	
	let brightness_scale = 20;
	let stabilize_brightness_scale = false;
	
	let center_x = 0;
	let center_y = 0;
	let box_size = 4;
	let zoom_level = 0;
	let currently_dragging = false;
	let was_recently_pinching = 0;
	let touch_distance = 0;
	let mouse_x = 0;
	let mouse_y = 0;
	
	let timeout_id = null;
	
	
	
	adjust_for_settings();
	
	setTimeout(init_listeners, 500);
	
	
	
	document.querySelector("#resolution-input").addEventListener("input", change_resolution);

	document.querySelector("#add-marker-button").addEventListener("click", add_marker);
	document.querySelector("#spread-markers-button").addEventListener("click", spread_roots);
	document.querySelector("#generate-high-res-plot-button").addEventListener("click", prepare_download);
	
	document.querySelector("#dim-input").addEventListener("keydown", function(e)
	{
		if (e.keyCode === 13)
		{
			stabilize_brightness_scale = true;
			
			draw_another_frame = true;
			
			if (need_to_restart)
			{
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
		}
	});
	
	window.addEventListener("resize", newtons_method_resize);
	Page.temporary_handlers["resize"].push(newtons_method_resize);
	
	
	
	Page.Applets.Canvases.to_resize = [document.querySelector("#newtons-method-plot"), document.querySelector("#root-selector")];
	
	Page.Applets.Canvases.resize_callback = function()
	{
		if (Page.Applets.Canvases.is_fullscreen)
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
		
		
		
		document.querySelector("#newtons-method-plot").setAttribute("width", image_width);
		document.querySelector("#newtons-method-plot").setAttribute("height", image_height);
		
		gl.viewport(0, 0, image_width, image_height);
		
		
		
		newtons_method_resize();
		
		window.requestAnimationFrame(draw_frame);
	};
	
	Page.Applets.Canvases.true_fullscreen = true;
	
	Page.Applets.Canvases.set_up_resizer();
	
	
	
	setTimeout(setup_webgl, 500);
	
	setTimeout(newtons_method_resize, 1000);
	
	
	
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
		
		uniform float box_size_halved;
		uniform float center_x;
		uniform float center_y;
		
		uniform int num_roots;
		
		uniform vec2 root_1;
		uniform vec2 root_2;
		uniform vec2 root_3;
		uniform vec2 root_4;
		uniform vec2 root_5;
		uniform vec2 root_6;
		uniform vec2 root_7;
		uniform vec2 root_8;
		
		const vec3 color_1 = vec3(1.0, 0.0, 0.0);
		const vec3 color_2 = vec3(0.0, 1.0, 0.0);
		const vec3 color_3 = vec3(0.0, 0.0, 1.0);
		const vec3 color_4 = vec3(0.0, 1.0, 1.0);
		const vec3 color_5 = vec3(1.0, 0.0, 1.0);
		const vec3 color_6 = vec3(1.0, 1.0, 0.0);
		const vec3 color_7 = vec3(0.5, 0.0, 1.0);
		const vec3 color_8 = vec3(1.0, 0.5, 0.0);
		
		uniform vec2 a;
		uniform vec2 c;
		
		uniform float brightness_scale;
		
		const float threshhold = .05;
		
		
		
		//Returns z_1 * z_2.
		vec2 complex_multiply(vec2 z_1, vec2 z_2)
		{
			return vec2(z_1.x * z_2.x - z_1.y * z_2.y, z_1.x * z_2.y + z_1.y * z_2.x);
		}
		
		
		
		//Returns 1/z.
		vec2 complex_invert(vec2 z)
		{
			float magnitude = z.x*z.x + z.y*z.y;
			
			return vec2(z.x / magnitude, -z.y / magnitude);
		}
		
		
		
		//Returns f(z) for a polynomial f with given roots.
		vec2 complex_polynomial(vec2 z)
		{
			vec2 result = vec2(1.0, 0.0);
			
			if (num_roots == 0)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_1);
			
			
			
			if (num_roots == 1)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_2);
			
			
			
			if (num_roots == 2)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_3);
			
			
			
			if (num_roots == 3)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_4);
			
			
			
			if (num_roots == 4)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_5);
			
			
			
			if (num_roots == 5)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_6);
			
			
			
			if (num_roots == 6)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_7);
			
			
			
			if (num_roots == 7)
			{
				return result;
			}
			
			result = complex_multiply(result, z - root_8);
			
			
			
			return result;
		}
		
		
		
		//Approximates f'(z) for a polynomial f with given roots.
		vec2 complex_derivative(vec2 z)
		{
			return 1000.0 * (complex_polynomial(z) - complex_polynomial(z - vec2(.001, 0.0)));
		}
		
		
		
		void main(void)
		{
			vec2 z = vec2(uv.x * aspect_ratio_x * box_size_halved + center_x, uv.y / aspect_ratio_y * box_size_halved + center_y);
			vec2 last_z = vec2(0.0, 0.0);
			
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
			
			for (int iteration = 0; iteration < 100; iteration++)
			{
				vec2 temp = complex_multiply(complex_multiply(complex_polynomial(z), complex_multiply(z - last_z, complex_invert(complex_polynomial(z) - complex_polynomial(last_z)))), a) + c;
				
				last_z = z;
				
				z -= temp;
				
				
				
				if (num_roots >= 1)
				{
					float d_0 = length(z - root_1);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_1);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_1 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 2)
				{
					float d_0 = length(z - root_2);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_2);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_2 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 3)
				{
					float d_0 = length(z - root_3);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_3);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_3 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 4)
				{
					float d_0 = length(z - root_4);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_4);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_4 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 5)
				{
					float d_0 = length(z - root_5);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_5);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_5 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 6)
				{
					float d_0 = length(z - root_6);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_6);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_6 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 7)
				{
					float d_0 = length(z - root_7);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_7);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_7 * brightness, 1.0);
						
						return;
					}
				}
				
				
				
				if (num_roots >= 8)
				{
					float d_0 = length(z - root_8);
					
					if (d_0 < threshhold)
					{
						float d_1 = length(last_z - root_8);
						
						float brightness_adjust = (log(threshhold) - log(d_0)) / (log(d_1) - log(d_0));
						
						float brightness = 1.0 - (float(iteration) - brightness_adjust) / brightness_scale;
						
						gl_FragColor = vec4(color_8 * brightness, 1.0);
						
						return;
					}
				}
			}
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
		
		
		
		shader_program.aspect_ratio_x_uniform = gl.getUniformLocation(shader_program, "aspect_ratio_x");
		shader_program.aspect_ratio_y_uniform = gl.getUniformLocation(shader_program, "aspect_ratio_y");
		
		shader_program.box_size_halved_uniform = gl.getUniformLocation(shader_program, "box_size_halved");
		shader_program.center_x_uniform = gl.getUniformLocation(shader_program, "center_x");
		shader_program.center_y_uniform = gl.getUniformLocation(shader_program, "center_y");
		
		shader_program.num_roots_uniform = gl.getUniformLocation(shader_program, "num_roots");
		
		shader_program.root_1_uniform = gl.getUniformLocation(shader_program, "root_1");
		shader_program.root_2_uniform = gl.getUniformLocation(shader_program, "root_2");
		shader_program.root_3_uniform = gl.getUniformLocation(shader_program, "root_3");
		shader_program.root_4_uniform = gl.getUniformLocation(shader_program, "root_4");
		shader_program.root_5_uniform = gl.getUniformLocation(shader_program, "root_5");
		shader_program.root_6_uniform = gl.getUniformLocation(shader_program, "root_6");
		shader_program.root_7_uniform = gl.getUniformLocation(shader_program, "root_7");
		shader_program.root_8_uniform = gl.getUniformLocation(shader_program, "root_8");
		
		shader_program.a_uniform = gl.getUniformLocation(shader_program, "a");
		shader_program.c_uniform = gl.getUniformLocation(shader_program, "c");
		
		shader_program.brightness_scale_uniform = gl.getUniformLocation(shader_program, "brightness_scale");
		
		
		document.querySelector("#newtons-method-plot").setAttribute("width", image_width);
		document.querySelector("#newtons-method-plot").setAttribute("height", image_height);
		
		gl.viewport(0, 0, image_width, image_height);
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
		/*
		current_roots[0][0] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(2 * 2 * Math.PI * frame / 6000)) - 3 + .5;
		current_roots[0][1] = .5 * (Math.cos(3 * 2 * Math.PI * frame / 6000) + Math.sin(5 * 2 * Math.PI * frame / 6000)) + 1 + .5;
		
		
		
		current_roots[1][0] = .5 * (Math.cos(2 * 2 * Math.PI * frame / 6000) + Math.sin(2 * Math.PI * frame / 6000)) - 1 + .5;
		current_roots[1][1] = .5 * (Math.cos(5 * 2 * Math.PI * frame / 6000) + Math.sin(3 * 2 * Math.PI * frame / 6000)) + 1 + .5;
		
		
		
		current_roots[2][0] = .5 * (Math.cos(3 * 2 * Math.PI * frame / 6000) + Math.sin(5 * 2 * Math.PI * frame / 6000)) + 1 + .5;
		current_roots[2][1] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(2 * 2 * Math.PI * frame / 6000)) + 1 + .5;
		
		
		
		current_roots[3][0] = .5 * (Math.cos(3 * 2 * Math.PI * frame / 6000) + Math.sin(2 * Math.PI * frame / 6000)) + 1 + .5;
		current_roots[3][1] = .5 * (Math.cos(5 * 2 * Math.PI * frame / 6000) + Math.sin(2 * 2 * Math.PI * frame / 6000)) - 1 + .5;
		
		
		
		current_roots[4][0] = .5 * (Math.cos(3 * 2 * Math.PI * frame / 6000) + Math.sin(7 * 2 * Math.PI * frame / 6000)) + 1 + .5;
		current_roots[4][1] = .5 * (Math.cos(5 * 2 * Math.PI * frame / 6000) + Math.sin(2 * Math.PI * frame / 6000)) - 3 + .5;
		
		
		
		current_roots[5][0] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(3 * 2 * Math.PI * frame / 6000)) - 1 + .5;
		current_roots[5][1] = .5 * (Math.cos(7 * 2 * Math.PI * frame / 6000) + Math.sin(2 * 2 * Math.PI * frame / 6000)) - 3 + .5;
		
		
		
		current_roots[6][0] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(3 * 2 * Math.PI * frame / 6000)) - 3 + .5;
		current_roots[6][1] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(7 * 2 * Math.PI * frame / 6000)) - 3 + .5;
		
		
		
		current_roots[7][0] = .5 * (Math.cos(3 * 2 * Math.PI * frame / 6000) + Math.sin(7 * 2 * Math.PI * frame / 6000)) - 3 + .5;
		current_roots[7][1] = .5 * (Math.cos(2 * Math.PI * frame / 6000) + Math.sin(5 * 2 * Math.PI * frame / 6000)) - 1 + .5;
		
		
		
		let rect = document.querySelector("#root-selector").getBoundingClientRect();
		
		for (let i = 0; i < current_roots.length; i++)
		{
			let row = Math.floor(root_selector_height * (1 - (current_roots[i][1] / 4 + .5)));
			let col = Math.floor(root_selector_width * (current_roots[i][0] / 4 + .5));
			
			root_markers[i].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		
		
		console.log(frame, Math.round(brightness_scale * 100) / 100);
		*/
		
		
		
		
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
		
		
		
		gl.uniform1f(shader_program.box_size_halved_uniform, box_size / 2);
		
		gl.uniform1f(shader_program.center_x_uniform, center_x);
		gl.uniform1f(shader_program.center_y_uniform, center_y);
		
		
		
		gl.uniform1i(shader_program.num_roots_uniform, current_roots.length);
		
		if (current_roots.length >= 1)
		{
			gl.uniform2fv(shader_program.root_1_uniform, current_roots[0]);
		}
		
		if (current_roots.length >= 2)
		{
			gl.uniform2fv(shader_program.root_2_uniform, current_roots[1]);
		}
		
		if (current_roots.length >= 3)
		{
			gl.uniform2fv(shader_program.root_3_uniform, current_roots[2]);
		}
		
		if (current_roots.length >= 4)
		{
			gl.uniform2fv(shader_program.root_4_uniform, current_roots[3]);
		}
		
		if (current_roots.length >= 5)
		{
			gl.uniform2fv(shader_program.root_5_uniform, current_roots[4]);
		}
		
		if (current_roots.length >= 6)
		{
			gl.uniform2fv(shader_program.root_6_uniform, current_roots[5]);
		}
		
		if (current_roots.length >= 7)
		{
			gl.uniform2fv(shader_program.root_7_uniform, current_roots[6]);
		}
		
		if (current_roots.length >= 8)
		{
			gl.uniform2fv(shader_program.root_8_uniform, current_roots[7]);
		}
		
		gl.uniform2fv(shader_program.a_uniform, a);
		gl.uniform2f(shader_program.c_uniform, c[0] / 20, c[1] / 20);
		
		gl.uniform1f(shader_program.brightness_scale_uniform, brightness_scale);
		
		
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		
		
		let pixels = new Uint8Array(image_width * image_height * 4);
		gl.readPixels(0, 0, image_width, image_height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		
		let num_pixels_at_zero = 0;
		
		for (let i = 0; i < image_width * image_height; i++)
		{
			if (pixels[4 * i] === 1 || pixels[4 * i + 1] === 1 || pixels[4 * i + 2] === 1)
			{
				num_pixels_at_zero++;
			}
		}
		
		
		
		let changed_brightness_scale = false;
		
		if (num_pixels_at_zero < .000025 * image_width * image_height * current_roots.length && brightness_scale > .25)
		{
			brightness_scale -= .25;
			
			changed_brightness_scale = true;
		}
		
		else if (num_pixels_at_zero > .00005 * image_width * image_height * current_roots.length)
		{
			brightness_scale += .25;
			
			changed_brightness_scale = true;
		}
		
		
		
		if (stabilize_brightness_scale)
		{
			if (changed_brightness_scale)
			{
				window.requestAnimationFrame(draw_frame);
			}
			
			else
			{
				stabilize_brightness_scale = false;
				need_to_restart = true;
			}
		}
		
		else if (draw_another_frame)
		{
			draw_another_frame = false;
			
			window.requestAnimationFrame(draw_frame);
		}
		
		else
		{
			need_to_restart = true;
		}
		
		
		//Uncomment to generate an animation.
		/*
		let link = document.createElement("a");

		link.download = `${frame}.png`;
		
		link.href = document.querySelector("#newtons-method-plot").toDataURL();
		
		link.click();
		
		link.remove();
		
		
		
		frame++;
		
		
		
		setTimeout(function()
		{
			window.requestAnimationFrame(draw_frame);
		}, 300);
		*/
	}
	
	
	
	function init_listeners()
	{
		document.documentElement.addEventListener("touchstart", handle_touchstart_event, false);
		document.documentElement.addEventListener("touchmove", handle_touchmove_event, false);
		document.documentElement.addEventListener("touchend", handle_touchend_event, false);
		
		document.documentElement.addEventListener("mousedown", handle_mousedown_event, false);
		document.documentElement.addEventListener("mousemove", handle_mousemove_event, false);
		document.documentElement.addEventListener("mouseup", handle_mouseup_event, false);
		
		window.addEventListener("wheel", handle_wheel_event, {passive: false});
		Page.temporary_handlers["wheel"].push(handle_wheel_event);
		
		Page.temporary_handlers["touchstart"].push(handle_touchstart_event);
		Page.temporary_handlers["touchmove"].push(handle_touchmove_event);
		Page.temporary_handlers["touchend"].push(handle_touchend_event);
		
		Page.temporary_handlers["mousedown"].push(handle_mousedown_event);
		Page.temporary_handlers["mousemove"].push(handle_mousemove_event);
		Page.temporary_handlers["mouseup"].push(handle_mouseup_event);
		
		
		
		document.querySelector("#root-a-input").addEventListener("input", set_root);
		document.querySelector("#root-b-input").addEventListener("input", set_root);
		
		document.querySelector("#root-a-input").addEventListener("keydown", function(e)
		{
			if (e.keyCode === 13)
			{
				window.requestAnimationFrame(draw_frame);
			}
		});
		
		document.querySelector("#root-b-input").addEventListener("keydown", function(e)
		{
			if (e.keyCode === 13)
			{
				window.requestAnimationFrame(draw_frame);
			}
		});
	}
	
	
	
	function set_up_a_and_c_markers()
	{
		let x = 1;
		let y = 0;
		
		let row = 0;
		let col = 0;
		
		if (image_width >= image_height)
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / (image_width / image_height) / box_size + .5));
		}
		
		else
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) * (image_width / image_height) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / box_size + .5));
		}
		
		
		
		let element = document.createElement("div");
		element.classList.add("root-marker");
		element.classList.add("a-marker");
		element.classList.add("no-floating-footer");
		element.id = `root-marker-8`;
		element.style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		
		document.querySelector("#root-selector").appendChild(element);
		
		
		
		x = 0;
		y = 0;
		
		if (image_width >= image_height)
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / (image_width / image_height) / box_size + .5));
		}
		
		else
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) * (image_width / image_height) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / box_size + .5));
		}
		
		element = document.createElement("div");
		element.classList.add("root-marker");
		element.classList.add("c-marker");
		element.classList.add("no-floating-footer");
		element.id = `root-marker-9`;
		element.style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		
		document.querySelector("#root-selector").appendChild(element);
	}
	
	
	
	function add_marker()
	{
		if (current_roots.length === 8)
		{
			return;
		}
		
		
		
		let x = Math.random() * 3 - 1.5;
		let y = Math.random() * 3 - 1.5;
		
		let row = 0;
		let col = 0;
		
		if (image_width >= image_height)
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / (image_width / image_height) / box_size + .5));
		}
		
		else
		{
			row = Math.floor(root_selector_height * (1 - ((y - center_y) * (image_width / image_height) / box_size + .5)));
			col = Math.floor(root_selector_width * ((x - center_x) / box_size + .5));
		}
		
		
		
		let element = document.createElement("div");
		element.classList.add("root-marker");
		element.classList.add("no-floating-footer");
		element.id = `root-marker-${root_markers.length}`;
		element.style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		
		document.querySelector("#root-selector").appendChild(element);
		
		root_markers.push(element);
		
		current_roots.push([x, y]);
		
		if (current_roots.length === 1)
		{
			set_up_a_and_c_markers();
		}
		
		brightness_scale = 20;
		
		stabilize_brightness_scale = true;
		
		if (need_to_restart)
		{
			window.requestAnimationFrame(draw_frame);
		}
	}
	
	
	
	function handle_mousedown_event(e)
	{
		active_marker = -1;
		
		//Figure out which marker, if any, this is referencing.
		for (let i = 0; i < 10; i++)
		{
			if (e.target.id === `root-marker-${i}`)
			{
				e.preventDefault();
				
				active_marker = i;
				
				break;
			}
		}
		
		if (e.target.id === "root-selector")
		{
			currently_dragging = true;
			
			mouse_x = e.clientX;
			mouse_y = e.clientY;
		}
	}
	
	
	
	function handle_mouseup_event(e)
	{
		if (active_marker !== -1)
		{
			document.body.style.WebkitUserSelect = "";
			
			last_active_marker = active_marker;
			
			show_root_setter();
		}
		
		active_marker = -1;
		
		currently_dragging = false;
		
		stabilize_brightness_scale = true;
		
		draw_another_frame = true;
		
		if (need_to_restart)
		{
			need_to_restart = false;
			
			window.requestAnimationFrame(draw_frame);
		}
	}
	
	
	
	function handle_mousemove_event(e)
	{
		let new_mouse_x = e.clientX;
		let new_mouse_y = e.clientY;
		
		let mouse_x_delta = new_mouse_x - mouse_x;
		let mouse_y_delta = new_mouse_y - mouse_y;
		
		mouse_x = new_mouse_x;
		mouse_y = new_mouse_y;
		
		if (currently_dragging)
		{
			e.preventDefault();
			
			center_x -= mouse_x_delta / root_selector_size * box_size;
			center_y += mouse_y_delta / root_selector_size * box_size;
			
			update_root_markers();
			
			draw_another_frame = true;
			
			if (need_to_restart)
			{
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
		}
		
		
		
		else if (active_marker !== -1)
		{
			let row = null;
			let col = null;
			
			let rect = document.querySelector("#root-selector").getBoundingClientRect();
			
			if (e.type === "touchmove")
			{
				row = e.touches[0].clientY - rect.top;
				col = e.touches[0].clientX - rect.left;
			}
			
			else
			{
				row = e.clientY - rect.top;
				col = e.clientX - rect.left;
			}
			
			
			
			if (row < root_marker_radius)
			{
				row = root_marker_radius;
			}
			
			if (row > root_selector_height - root_marker_radius)
			{
				row = root_selector_height - root_marker_radius;
			}
			
			if (col < root_marker_radius)
			{
				col = root_marker_radius;
			}
			
			if (col > root_selector_width - root_marker_radius)
			{
				col = root_selector_width - root_marker_radius;
			}
			
			
			
			if (active_marker < 8)
			{
				root_markers[active_marker].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				current_roots[active_marker][0] = x;
				current_roots[active_marker][1] = y;
			}
			
			else if (active_marker === 8)
			{
				document.querySelector(".a-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				a[0] = x;
				a[1] = y;
			}
			
			else
			{
				document.querySelector(".c-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				c[0] = x;
				c[1] = y;
			}
			
			

			draw_another_frame = true;
			
			if (stabilize_brightness_scale || need_to_restart)
			{
				stabilize_brightness_scale = false;
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
		}
	}
	
	
	
	function handle_touchstart_event(e)
	{
		active_marker = -1;
		
		//Figure out which marker, if any, this is referencing.
		for (let i = 0; i < 10; i++)
		{
			if (e.target.id === `root-marker-${i}`)
			{
				e.preventDefault();
				
				active_marker = i;
				
				break;
			}
		}
		
		if (e.target.id === "root-selector")
		{
			currently_dragging = true;
			
			mouse_x = e.touches[0].clientX;
			mouse_y = e.touches[0].clientY;
		}
	}
	
	
	
	function handle_touchend_event(e)
	{
		if (active_marker !== -1)
		{
			document.body.style.WebkitUserSelect = "";
			
			last_active_marker = active_marker;
			
			show_root_setter();
		}
		
		active_marker = -1;
		
		currently_dragging = false;
		
		stabilize_brightness_scale = true;
		
		draw_another_frame = true;
		
		if (need_to_restart)
		{
			need_to_restart = false;
			
			window.requestAnimationFrame(draw_frame);
		}
	}
	
	
	
	function handle_touchmove_event(e)
	{
		if (currently_dragging)
		{
			e.preventDefault();
			
			let new_mouse_x = e.touches[0].clientX;
			let new_mouse_y = e.touches[0].clientY;
			
			if (e.touches.length >= 2)
			{
				was_recently_pinching = 10;
				
				let x_distance = e.touches[0].clientX - e.touches[1].clientX;
				let y_distance = e.touches[0].clientY - e.touches[1].clientY;
				
				let new_touch_distance = Math.sqrt(x_distance * x_distance + y_distance * y_distance);
				
				let touch_distance_delta = new_touch_distance - touch_distance;
				
				touch_distance = new_touch_distance;
				
				if (Math.abs(touch_distance_delta) > 20)
				{
					return;
				}
				
				
				
				let rect = document.querySelector("#root-selector").getBoundingClientRect();
				
				let touch_center_x_proportion = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / root_selector_width;
				let touch_center_y_proportion = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / root_selector_height;
				
				let fixed_point_x = (touch_center_x_proportion * box_size - box_size / 2) * image_width / image_height + center_x;
				let fixed_point_y = (box_size / 2 - touch_center_y_proportion * box_size) + center_y;
				
				
				
				let increment = touch_distance_delta / 2;
				
				if (zoom_level + increment >= -300 && zoom_level + increment <= 300)
				{
					zoom_level += increment;
					
					box_size = 4 / Math.pow(1.02, zoom_level);
				}
				
				
				
				center_x = fixed_point_x - (touch_center_x_proportion * box_size - box_size / 2) * image_width / image_height;
				center_y = fixed_point_y - (box_size / 2 - touch_center_y_proportion * box_size);
			}
			
			
			
			else
			{
				was_recently_pinching--;
				
				if (was_recently_pinching < 0)
				{
					was_recently_pinching = 0;
				}
			}
			
			
			
			let mouse_x_delta = new_mouse_x - mouse_x;
			let mouse_y_delta = new_mouse_y - mouse_y;
			
			mouse_x = new_mouse_x;
			mouse_y = new_mouse_y;
			
			center_x -= mouse_x_delta / root_selector_size * box_size;
			center_y += mouse_y_delta / root_selector_size * box_size;
			
			update_root_markers();
			
			draw_another_frame = true;
			
			if (need_to_restart)
			{
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
		}
		
		
		
		else if (active_marker !== -1)
		{
			let row = null;
			let col = null;
			
			let rect = document.querySelector("#root-selector").getBoundingClientRect();
			
			if (e.type === "touchmove")
			{
				row = e.touches[0].clientY - rect.top;
				col = e.touches[0].clientX - rect.left;
			}
			
			else
			{
				row = e.clientY - rect.top;
				col = e.clientX - rect.left;
			}
			
			
			
			if (row < root_marker_radius)
			{
				row = root_marker_radius;
			}
			
			if (row > root_selector_height - root_marker_radius)
			{
				row = root_selector_height - root_marker_radius;
			}
			
			if (col < root_marker_radius)
			{
				col = root_marker_radius;
			}
			
			if (col > root_selector_width - root_marker_radius)
			{
				col = root_selector_width - root_marker_radius;
			}
			
			
			
			if (active_marker < 8)
			{
				root_markers[active_marker].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				current_roots[active_marker][0] = x;
				current_roots[active_marker][1] = y;
			}
			
			else if (active_marker === 8)
			{
				document.querySelector(".a-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				a[0] = x;
				a[1] = y;
			}
			
			else
			{
				document.querySelector(".c-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
				
				let x = 0;
				let y = 0;
				
				if (image_width >= image_height)
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size * (image_width / image_height) + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size + center_y;
				}
				
				else
				{
					x = ((col - root_selector_width/2) / root_selector_width) * box_size + center_x;
					y = (-(row - root_selector_height/2) / root_selector_height) * box_size / (image_width / image_height) + center_y;
				}
				
				c[0] = x;
				c[1] = y;
			}
			
			

			draw_another_frame = true;
			
			if (stabilize_brightness_scale || need_to_restart)
			{
				stabilize_brightness_scale = false;
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
		}
	}
	
	
	
	function handle_wheel_event(e)
	{
		if (document.elementFromPoint(mouse_x, mouse_y).id === "root-selector" || document.elementFromPoint(mouse_x, mouse_y).classList.contains("root-marker"))
		{
			e.preventDefault();
			
			zoom_level -= Math.sign(e.deltaY) * 10;
			
			if (zoom_level < -300)
			{
				zoom_level = -300;
			}
			
			if (zoom_level > 300)
			{
				zoom_level = 300;
			}
			
			
			
			let rect = document.querySelector("#root-selector").getBoundingClientRect();
			
			let mouse_x_proportion = (mouse_x - rect.left) / root_selector_width;
			let mouse_y_proportion = (mouse_y - rect.top) / root_selector_height;
			
			let fixed_point_x = (mouse_x_proportion * box_size - box_size / 2) * image_width / image_height + center_x;
			let fixed_point_y = (box_size / 2 - mouse_y_proportion * box_size) + center_y;
			
			
			
			box_size = 3 / Math.pow(1.02, zoom_level);
			
			
			
			center_x = fixed_point_x - (mouse_x_proportion * box_size - box_size / 2) * image_width / image_height;
			center_y = fixed_point_y - (box_size / 2 - mouse_y_proportion * box_size);
			
			
			
			update_root_markers();
			
			
			
			draw_another_frame = true;
			
			if (need_to_restart)
			{
				stabilize_brightness_scale = false;
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}
			
			
			
			try {clearTimeout(timeout_id);}
			catch(ex) {}
			
			timeout_id = setTimeout(function()
			{
				stabilize_brightness_scale = true;
				
				need_to_restart = false;
				
				window.requestAnimationFrame(draw_frame);
			}, 500);
		}
	}
	
	
	
	//Spreads the roots in an even radius.
	function spread_roots(high_res = true)
	{
		for (let i = 0; i < current_roots.length; i++)
		{
			if (i < current_roots.length / 2 || current_roots.length % 2 === 1)
			{
				current_roots[i][0] = Math.cos(2 * Math.PI * 2 * i / current_roots.length);
				current_roots[i][1] = Math.sin(2 * Math.PI * 2 * i / current_roots.length);
			}
			
			else
			{
				current_roots[i][0] = Math.cos(2 * Math.PI * (2 * i + 1) / current_roots.length);
				current_roots[i][1] = Math.sin(2 * Math.PI * (2 * i + 1) / current_roots.length);
			}
			
			
			
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[i][1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[i][0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[i][1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[i][0] - center_x) / box_size + .5));
			}
			
			root_markers[i].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		
		
		stabilize_brightness_scale = true;
		
		if (need_to_restart)
		{
			window.requestAnimationFrame(draw_frame);
		}
	}
	
	
	
	function show_root_setter()
	{
		if (last_active_marker < 8)
		{
			document.querySelector("#root-a-input").value = Math.round(current_roots[last_active_marker][0] * 1000) / 1000;
			document.querySelector("#root-b-input").value = Math.round(current_roots[last_active_marker][1] * 1000) / 1000;
		}
		
		else if (last_active_marker === 8)
		{
			document.querySelector("#root-a-input").value = Math.round(a[0] * 1000) / 1000;
			document.querySelector("#root-b-input").value = Math.round(a[1] * 1000) / 1000;
		}
		
		else
		{
			document.querySelector("#root-a-input").value = Math.round(c[0] * 100000) / 100000;
			document.querySelector("#root-b-input").value = Math.round(c[1] * 100000) / 100000;
		}
		
		document.querySelector("#root-setter").style.pointerEvents = "auto";
		
		document.querySelector("#root-setter").style.opacity = 1;
	}
	
	
	
	function set_root()
	{
		if (last_active_marker < 8)
		{
			current_roots[last_active_marker][0] = parseFloat(document.querySelector("#root-a-input").value) || 0;
			current_roots[last_active_marker][1] = parseFloat(document.querySelector("#root-b-input").value) || 0;
			
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[last_active_marker][1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[last_active_marker][0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[last_active_marker][1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[last_active_marker][0] - center_x) / box_size + .5));
			}
			
			root_markers[last_active_marker].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		else if (last_active_marker === 8)
		{
			a[0] = parseFloat(document.querySelector("#root-a-input").value) || 0;
			a[1] = parseFloat(document.querySelector("#root-b-input").value) || 0;
			
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((a[1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((a[0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((a[1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((a[0] - center_x) / box_size + .5));
			}
			
			document.querySelector(".a-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		else
		{
			c[0] = parseFloat(document.querySelector("#root-a-input").value) || 0;
			c[1] = parseFloat(document.querySelector("#root-b-input").value) || 0;
			
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((c[1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((c[0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((c[1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((c[0] - center_x) / box_size + .5));
			}
			
			document.querySelector(".c-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		
		
		window.requestAnimationFrame(draw_frame);
	}
	
	
	
	function change_resolution()
	{
		image_size = parseInt(document.querySelector("#resolution-input").value || 500);
		
		if (image_size < 200)
		{
			image_size = 200;
		}
		
		if (image_size > 2000)
		{
			image_size = 2000;
		}
		
		
		
		if (Page.Applets.Canvases.is_fullscreen)
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
		
		
		
		document.querySelector("#newtons-method-plot").setAttribute("width", image_width);
		document.querySelector("#newtons-method-plot").setAttribute("height", image_height);
		
		gl.viewport(0, 0, image_width, image_height);
		
		window.requestAnimationFrame(draw_frame);
	}
	
	
	
	function prepare_download()
	{
		let old_image_size = image_size;
		
		image_size = parseInt(document.querySelector("#dim-input").value || 2000);
		
		if (Page.Applets.Canvases.is_fullscreen)
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
		
		
		
		document.querySelector("#newtons-method-plot").setAttribute("width", image_width);
		document.querySelector("#newtons-method-plot").setAttribute("height", image_height);
		
		gl.viewport(0, 0, image_width, image_height);
		
		draw_frame();
		
		
		
		let link = document.createElement("a");
		
		link.download = "newtons-method.png";
		
		link.href = document.querySelector("#newtons-method-plot").toDataURL();
		
		link.click();
		
		link.remove();
		
		
		
		image_size = old_image_size;
		
		if (Page.Applets.Canvases.is_fullscreen)
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
		
		
		
		document.querySelector("#newtons-method-plot").setAttribute("width", image_width);
		document.querySelector("#newtons-method-plot").setAttribute("height", image_height);
		
		gl.viewport(0, 0, image_width, image_height);
		
		draw_frame();
	}
	
	
	
	function newtons_method_resize()
	{
		root_selector_width = document.querySelector("#root-selector").offsetWidth;
		root_selector_height = document.querySelector("#root-selector").offsetHeight;
		root_selector_size = Math.min(root_selector_width, root_selector_height);
		
		update_root_markers();
	}
	
	
	
	function update_root_markers()
	{
		for (let i = 0; i < current_roots.length; i++)
		{
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[i][1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[i][0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((current_roots[i][1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((current_roots[i][0] - center_x) / box_size + .5));
			}
			
			root_markers[i].style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		
		
		try
		{
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((a[1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((a[0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((a[1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((a[0] - center_x) / box_size + .5));
			}
			
			document.querySelector(".a-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		catch(ex) {}
		
		
		
		try
		{
			let row = 0;
			let col = 0;
			
			if (image_width >= image_height)
			{
				row = Math.floor(root_selector_height * (1 - ((c[1] - center_y) / box_size + .5)));
				col = Math.floor(root_selector_width * ((c[0] - center_x) / (image_width / image_height) / box_size + .5));
			}
			
			else
			{
				row = Math.floor(root_selector_height * (1 - ((c[1] - center_y) * (image_width / image_height) / box_size + .5)));
				col = Math.floor(root_selector_width * ((c[0] - center_x) / box_size + .5));
			}
			
			document.querySelector(".c-marker").style.transform = `translate3d(${col - root_marker_radius}px, ${row - root_marker_radius}px, 0)`;
		}
		
		catch(ex) {}
	}



	function adjust_for_settings()
	{
		if (Site.Settings.url_vars["contrast"] === 1)
		{
			if (Site.Settings.url_vars["theme"] === 1)
			{
				document.querySelector("#newtons-method-plot").style.borderColor = "rgb(192, 192, 192)";
			}
			
			else
			{
				document.querySelector("#newtons-method-plot").style.borderColor = "rgb(64, 64, 64)";
			}
		}
		
		Site.add_style(`
			.root-marker.hover
			{
				background-color: rgb(127, 127, 127);	
			}
			
			.root-marker:not(:hover):focus
			{
				background-color: rgb(127, 127, 127);
				outline: none;
			}
		`, true);
	}
}()