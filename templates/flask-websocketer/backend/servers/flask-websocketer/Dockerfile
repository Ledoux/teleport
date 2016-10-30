FROM $(baseImage)
MAINTAINER $(maintainer)

ADD . /opt/docker/

ENV DOCKER_HOST $(host)
ENV SITE_NAME $(siteName)
ENV TYPE $(type)
ENV WEB on
$(extraConfig)

EXPOSE $(prodPort)

RUN pip install -r config/requirements.txt

CMD gunicorn --config config/$(type)_guwsgi.ini app
