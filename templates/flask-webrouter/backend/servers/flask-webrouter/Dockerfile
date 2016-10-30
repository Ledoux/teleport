FROM $(baseImage)
MAINTAINER $(maintainer)

ADD . /opt/docker/

ENV DOCKER_HOST $(host)
ENV SITE_NAME $(siteName)
ENV TYPE $(type)
ENV WEB on
$(extraConfig)

EXPOSE $(port)

RUN pip install -r config/requirements.txt

CMD uwsgi --ini config/$(type)_uwsgi.ini
