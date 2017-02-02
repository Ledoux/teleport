if [ ! -f ".projects.json" ] ; then
  echo "{}" > .projects.json
  chmod +wx .projects.json
fi
rm -rf lib
mkdir -p lib
npm run compile
