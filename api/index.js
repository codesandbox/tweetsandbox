const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.get('/:sandbox', async (req, res) => {
  const sandboxId = req.params.sandbox;

  const filePath = req.query.file;
  const [path, position] = filePath.split(':');
  const [start, end] = (position || '0-Infinity').split('-');

  const results = await fetch(
    'https://codesandbox.stream/api/v1/sandboxes/' + sandboxId
  );
  const { data } = await results.json();
  const directories = data.directories;
  let files = data.modules;

  files = files.map((file) => {
    file.path = getPath(file, directories);
    return file;
  });

  const file = files.find((file) => file.path === path);
  const code = file.code.slice(start, end);

  const response = await fetch(
    'https://carbonara.codesandbox1.vercel.app/api/cook',
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        backgroundColor: '#010101',
        theme: 'verminal',
        windowControls: false,
        language: 'jsx',
        paddingHorizontal: '24px',
        paddingVertical: '24px',
        lineHeight: '150%',
      }),
    }
  );

  const buffer = await response.buffer();

  res.writeHead(200, { 'Content-Type': 'image/png' });
  res.end(buffer, 'binary');
});

const getPath = (file, directories) => {
  if (!file.directory_shortid) {
    return (file.path = '/' + file.title);
  }

  // TODO: Handle nested paths
  const directory = directories.find(
    (directory) => directory.shortid === file.directory_shortid
  );
  const path = '/' + directory.title + '/' + file.title;
  return path;
};

app.listen(port);
