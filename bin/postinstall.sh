if [ ! -f ".projects.json" ] ; then
  echo "{}" > .projects.json
  chmod -r +wr ../teleport.js
fi
rm -rf lib
mkdir -p lib
npm run compile
