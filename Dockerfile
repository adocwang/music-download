FROM python:3.6-slim
RUN pip install musicdl
RUN pip install bottle
WORKDIR /data/webroot/
COPY . .
EXPOSE 8000/tcp
CMD [ "python","main.py"]