const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const SitemapPlugin = require('sitemap-webpack-plugin').default;


const INCLUDE_PATTERN = /<include src="(.+)"\s*\/?>(?:<\/include>)?/gi;
const processNestedHtml = (content, loaderContext, dir = null) =>
  !INCLUDE_PATTERN.test(content)
    ? content
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const filePath = path.resolve(dir || loaderContext.context, src);
        loaderContext.dependency(filePath);
        return processNestedHtml(
          loaderContext.fs.readFileSync(filePath, 'utf8'),
          loaderContext,
          path.dirname(filePath)
        );
      });


      
// HTML generation
const paths = [
  { path: '/', priority: 1.0 },
  { path: '/projects.html', priority: 0.8 },
  { path: '/news.html', priority: 0.8 },
  { path: '/blog-01.html', priority: 0.64 },
  { path: '/blog-02.html', priority: 0.64 },
  { path: '/news-01.html', priority: 0.64 },
  { path: '/news-02.html', priority: 0.64 },
  { path: '/news-03.html', priority: 0.64 },
  { path: '/news-04.html', priority: 0.64 },
];

const generateHTMLPlugins = () => glob.sync('./src/*.html').map((dir) => {
  const filename = path.basename(dir);

  if (filename !== '404.html') {
    paths.push(filename);
  }

  return new HtmlWebpackPlugin({
    filename,
    template: `./src/${filename}`,
    favicon: `./src/images/logo/favicon.jpg`,
    inject: 'body',
  });
});

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  devServer: {
    static: {
      directory: path.join(__dirname, './build'),
    },
    compress: true,
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          preprocessor: processNestedHtml,
        },
      },
    ],
  },
  plugins: [
    ...generateHTMLPlugins(),
    new MiniCssExtractPlugin({
      filename: 'style.css',
      chunkFilename: 'style.css',
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "src/images", 
          to: "images",
          noErrorOnMissing: true 
        },
        { 
          from: "src/robots.txt",
          to: "robots.txt"
        },
      ],
    }),
    new SitemapPlugin({
      base: 'https://akademiainicjatyw.pl',
      paths,
      options: {
        filename: 'sitemap.xml',
        lastmod: true,
        changefreq: 'monthly'
      }
    })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    assetModuleFilename: (pathData) => {
      const filepath = path
        .dirname(pathData.filename)
        .split("/")
        .slice(1)
        .join("/");
      return `${filepath}/[name][ext]`;
    },
  },
};

