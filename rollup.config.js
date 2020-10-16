import typescript from "@rollup/plugin-typescript";
import sveltePreprocess from "svelte-preprocess";
import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import progress from "rollup-plugin-progress";
import workerLoader from "rollup-plugin-web-worker-loader";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.ts",
  output: {
    sourcemap: false,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js"
  },
  plugins: [
    progress(),
    
    resolve({
      browser: true,
      extensions: [".svelte", ".ts", ".js"],
      dedupe: ["svelte"]
    }),
    commonjs(),

    typeCheck(),
    typescript({ sourceMap: false }),
    svelte({
      preprocess: sveltePreprocess(),
      dev: !production,
      css: css => {
        css.write("public/build/bundle.css");
      }
    }),

    workerLoader(),

    !production && serve(),
    !production && livereload("public"),
    production && terser(),
  ],
};

function typeCheck() {
  return {
    writeBundle() {
      require('child_process').spawn('svelte-check', {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });
    }
  }
}

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        });
      }
    }
  };
}