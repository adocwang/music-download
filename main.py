import json
import os

import bottle
import requests
from bottle import request, route, run, get, static_file, post
from musicdl import musicdl

config = {'logfilepath': 'musicdl.log', 'savedir': 'downloaded', 'search_size_per_source': 5, 'proxies': {}}
logger_handle = musicdl.Logger(config['logfilepath'])
supported_sources = {
    'kuwo': musicdl.Kuwo,
    'joox': musicdl.Joox,
    'migu': musicdl.Migu,
    'kugou': musicdl.Kugou,
    'lizhi': musicdl.Lizhi,
    'xiami': musicdl.Xiami,
    'yiting': musicdl.YiTing,
    'netease': musicdl.Netease,
    'qqmusic': musicdl.QQMusic,
    'qianqian': musicdl.Qianqian,
    'fivesing': musicdl.FiveSing,
}
sources = {}


@route('/static/<filename:path>')
def send_static(filename):
    return static_file(filename, root='./front/build/static')


@route('/')
def index():
    return static_file("index.html", root='./front/build')


def threadSearch(search_api, keyword, search_results):
    try:
        search_results.update(search_api(keyword))
    except Exception as err:
        logger_handle.error(err)


@post('/search')
def search():
    res = {"result": False, "items": []}
    print(request.json)
    client = get_client(request.json['source'])
    if client is not None:
        search_results = client.search(request.json['keyword'])
        print(search_results)
        res = {"result": True, "items": search_results}
    return json.dumps(res)


@post('/download')
def download():
    print(request.json)
    url_download(request.json['download_url'],
                 request.json['songname'] + "-" + request.json['album'] + "-" + request.json['singers'] + "-" +
                 request.json['source'] + "." +
                 request.json[
                     'ext'])
    return json.dumps({"result": True})


def url_download(url, filename=None):
    """
    下载文件到指定目录
    :param url: 文件下载的url
    :param filename: 要存放的目录及文件名，例如：./test.xls
    :return:
    """
    down_res = requests.get(url)
    path = os.path.join("downloads", filename)
    if os.environ.get('DOWNLOAD_DIR'):
        path = os.path.join(os.environ.get('DOWNLOAD_DIR'), filename)
    print(path)
    with open(path, 'wb') as file:
        file.write(down_res.content)


@bottle.error(405)
def method_not_allowed(res):
    if request.method == 'OPTIONS':
        new_res = bottle.HTTPResponse()
        new_res.set_header('Access-Control-Allow-Origin', 'http://localhost:3000')
        new_res.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        new_res.set_header('Access-Control-Allow-Headers', 'Content-Type')
        new_res.set_header('Access-Control-Max-Age', '86400')
        return new_res
    res.headers['Allow'] += ', OPTIONS'
    return request.app.default_error_handler(res)


@bottle.hook('after_request')
def enableCORSAfterRequestHook():
    bottle.response.set_header('Access-Control-Allow-Origin', '*')


def get_client(source):
    if sources.get(source):
        return sources[source]
    elif supported_sources.get(source):
        sources[source] = supported_sources[source](config=config, logger_handle=logger_handle)
        return sources[source]
    else:
        return None


run(host='0.0.0.0', port=8000)
