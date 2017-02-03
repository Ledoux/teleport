if [ ! -f ".projects.json" ] ; then
  echo "{}" > .projects.json
  chmod -R +w ../teleport
fi
rm -rf lib
mkdir -p lib
npm run compile
