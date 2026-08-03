const { resolve, relative } = require('path');
const { globSync } = require('glob');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const { ProvidePlugin, BannerPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';
const isDevelopment = !isProd;

const fastRefresh = isDevelopment ? new ReactRefreshWebpackPlugin() : null;

const SANDBOX_SUFFIX = '-sandbox';

const WIDGETS_DIR = resolve(__dirname, 'src/widgets');

/**
 * L'entry `App` serve solo a produrre App.css: il .js che webpack genera per
 * ogni entry non ha contenuto utile e nessuno lo carica.
 */
class DropCssOnlyEntryScripts {
  constructor(entryNames) {
    this.entryNames = entryNames;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('DropCssOnlyEntryScripts', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'DropCssOnlyEntryScripts',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        (assets) => {
          for (const name of Object.keys(assets)) {
            if (this.entryNames.some((entry) => new RegExp(`^${entry}\\.js(\\.map)?$`).test(name))) {
              compilation.deleteAsset(name);
            }
          }
        }
      );
    });
  }
}

// Un entry per ogni widget, piu' la copia -sandbox richiesta da RemNote.
// I path sono assoluti: le versioni recenti di glob non conservano il prefisso './'.
const widgetEntries = globSync('**/*.tsx', { cwd: WIDGETS_DIR, absolute: true }).reduce(
  (entries, file) => {
    const name = relative(WIDGETS_DIR, file)
      .replace(/\.[tj]sx?$/, '')
      .replace(/\\/g, '/');

    entries[name] = file;
    entries[`${name}${SANDBOX_SUFFIX}`] = file;
    return entries;
  },
  {}
);

const config = {
  mode: isProd ? 'production' : 'development',
  // L'entry `App` esiste solo per emettere dist/App.css: e' l'unico foglio di
  // stile che l'SDK carica nei widget (inietta <link href="App.css">).
  entry: { ...widgetEntries, App: resolve(__dirname, 'src/App.css') },

  output: {
    path: resolve(__dirname, 'dist'),
    filename: `[name].js`,
    publicPath: '',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  // Ogni widget e' un bundle isolato che include React e l'SDK: superare i
  // 244 KiB e' la norma per un plugin RemNote, non un problema da segnalare.
  performance: { hints: false },
  module: {
    rules: [
      {
        // Niente `loader` fisso: esbuild lo deduce dall'estensione. Forzando
        // 'tsx' anche sui .ts, un generico come <T>(x) => x verrebbe letto
        // come JSX e la build fallirebbe.
        test: /\.(ts|tsx|jsx|js)$/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2020',
          minify: false,
        },
      },
      {
        // Sempre estratto su file, anche in sviluppo: style-loader iniettera'
        // il CSS via JS, ma l'SDK lo cerca come file App.css.
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new DropCssOnlyEntryScripts(['App']),
    new HtmlWebpackPlugin({
      templateContent: `
      <body></body>
      <script type="text/javascript">
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      const widgetName = queryParams["widgetName"];
      if (widgetName == undefined) {document.body.innerHTML+="Widget ID not specified."}

      const s = document.createElement('script');
      s.type = "module";
      s.src = widgetName+"${SANDBOX_SUFFIX}.js";
      document.body.appendChild(s);
      </script>
    `,
      filename: 'index.html',
      inject: false,
    }),
    new ProvidePlugin({
      React: 'react',
      reactDOM: 'react-dom',
    }),
    // Solo sui .js: senza `test` il banner finirebbe anche in testa ai .css,
    // rendendoli invalidi.
    new BannerPlugin({
      test: /\.js$/,
      banner: (file) => {
        return !file.chunk.name.includes(SANDBOX_SUFFIX) ? 'const IMPORT_META=import.meta;' : '';
      },
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'README.md', to: '' },
      ],
    }),
    fastRefresh,
  ].filter(Boolean),
};

if (isProd) {
  config.optimization = {
    minimize: isProd,
    minimizer: [new EsbuildPlugin()],
  };
} else {
  // for more information, see https://webpack.js.org/configuration/dev-server
  config.devServer = {
    port: 8080,
    open: true,
    hot: true,
    compress: true,
    watchFiles: ['src/**/*'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    },
  };
}

module.exports = config;
