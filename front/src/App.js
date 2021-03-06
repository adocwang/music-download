import React, {useEffect, useRef, useState} from 'react';
import {Button, Input, Checkbox, Row, Col, Divider, PageHeader, Form, Table, Space} from 'antd';
import Highlighter from 'react-highlight-words';
import {SearchOutlined, PlayCircleOutlined, LoadingOutlined, DownloadOutlined} from '@ant-design/icons';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';

// const BASE_URL = "http://localhost:8080";
const BASE_URL = "";
const SEARCH_URL = BASE_URL + "/search";
const DOWNLOAD_URL = BASE_URL + "/download";

const App = () => {
    let [audioUrl, setAudioUrl] = useState("");
    let [resultData, setResultData] = useState([]);
    let [searchText, setSearchText] = useState();
    let [searchedColumn, setSearchedColumn] = useState();
    let searchInput = useRef();
    let tmpData = [];
    let audioPlayer = null;
    // useEffect(() => {
    //     if (audioPlayer) {
    //         audioPlayer.stop();
    //         audioPlayer = null;
    //     }
    //     audioPlayer = new Audio(audioUrl);
    //     audioPlayer.play();
    // }, [audioPlayer]);
    const onSearch = (values) => {
        console.log(values);
        tmpData = [];
        let dataIndex = 0;
        for (let source of values.sources) {
            fetch(SEARCH_URL, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Content-Type': 'application/json'
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify({source: source, keyword: values.keyword}) // body data type must match "Content-Type" header
            }).then(response => response.json()).then(res => {
                console.log(res);
                if (res.result) {
                    for (let item of res.items) {
                        item.id = ++dataIndex;
                        tmpData.push(item);
                    }
                    setResultData([...tmpData])
                } else {
                    console.error(values.sources[0] + " error!")
                }
            });
        }
    };

    const formItemLayout = {
        labelCol: {span: 6},
        wrapperCol: {span: 14},
    };

    const sources = {
        'migu': "????????????",
        'netease': "???????????????",
        'kuwo': "??????",
        'kugou': "????????????",
        'qqmusic': "QQ??????",
        'lizhi': "??????FM",
        'xiami': "????????????",
        'yiting': "????????????",
        'qianqian': "????????????",
        'fivesing': "5SING??????",
        'joox': "JOOX??????",
    };

    const getColumnSearchProps = dataIndex => {
        return {
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                <div style={{padding: 8}}>
                    <Input
                        ref={node => {
                            searchInput = node;
                        }}
                        placeholder={`Search ${dataIndex}`}
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        style={{marginBottom: 8, display: 'block'}}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                            icon={<SearchOutlined/>}
                            size="small"
                            style={{width: 90}}
                        >
                            ??????
                        </Button>
                        <Button onClick={() => handleReset(clearFilters, confirm, dataIndex)} size="small"
                                style={{width: 90}}>
                            ??????
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: filtered => <SearchOutlined style={{color: filtered ? '#1890ff' : undefined}}/>,
            onFilter: (value, record) =>
                record[dataIndex]
                    ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                    : '',
            onFilterDropdownVisibleChange: visible => {
                if (visible) {
                    setTimeout(() => searchInput.select(), 100);
                }
            },
            render: text =>
                searchedColumn === dataIndex ? (
                    <Highlighter
                        highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
                        searchWords={[searchText]}
                        autoEscape
                        textToHighlight={text ? text.toString() : ''}
                    />
                ) : (
                    text
                ),
        };
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters, confirm, dataIndex) => {
        clearFilters();
        confirm();
        setSearchText("");
        setSearchedColumn(dataIndex);
    };

    const playSong = (url) => {
        setAudioUrl(url);
    };

    const downloadSong = (record) => {
        fetch(DOWNLOAD_URL, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(record) // body data type must match "Content-Type" header
        }).then(response => response.json()).then(res => {
            console.log(res);
        });
    };

    const columns = [
        {
            title: '??????',
            dataIndex: 'songname',
            ...getColumnSearchProps('songname')
        },
        {
            title: '??????',
            dataIndex: 'singers',
            ...getColumnSearchProps('singers')
        },
        {
            title: '??????',
            dataIndex: 'filesize',
            sorter: (a, b) => {
                let v1 = a.filesize.toString().replace("MB", "").replace("-", "0");
                let v2 = b.filesize.toString().replace("MB", "").replace("-", "0");
                return v1 - v2;
            },
        },
        {
            title: '??????',
            dataIndex: 'duration',
            sorter: (a, b) => {
                let v1p = a.duration.replace("-", "0").split(":");
                let v2p = b.duration.replace("-", "0").split(":");
                let v1 = parseInt(v1p[0]) * 3600 + parseInt(v1p[1]) * 60 + parseInt(v1p[2]);
                let v2 = parseInt(v2p[0]) * 3600 + parseInt(v2p[1]) * 60 + parseInt(v2p[2]);
                if (isNaN(v1)) v1 = 0;
                if (isNaN(v2)) v2 = 0;
                return v1 - v2;
            },
        },
        {
            title: '??????',
            dataIndex: 'ext',
            ...getColumnSearchProps('ext')
        },
        {
            title: '??????',
            dataIndex: 'album',
            ...getColumnSearchProps('album')
        },
        {
            title: '??????',
            key: 'source',
            dataIndex: 'source',
            render: (value, record) => {
                return sources[value];
            },
            ...getColumnSearchProps('source')
        },
        {
            title: '??????',
            key: (value, record) => record.id,
            render: (value, record) => {
                return (
                    <div>
                        <Button icon={<DownloadOutlined/>} size="small" onClick={(event) => {
                            downloadSong(record);
                        }} style={{marginRight: "10px"}}/>
                        <Button icon={record.download_url === audioUrl?<LoadingOutlined />:<PlayCircleOutlined/>} spin={record.download_url === audioUrl} size="small"
                                onClick={(event) => {
                                    playSong(record.download_url);
                                }}/>
                    </div>
                )
            },
        },
    ];

    function onChange(pagination, filters, sorter, extra) {
        console.log('params', pagination, filters, sorter, extra);
    }

    return (
        <div className="App">
            <PageHeader
                className="site-page-header"
                onBack={null}
                title="????????????"
                subTitle="????????????"
            />
            <Divider/>
            <Form
                name="validate_other"
                {...formItemLayout}
                onFinish={onSearch}
                initialValues={{
                    'sources': ["migu", "netease", "kugou"],
                }}
            >
                <Form.Item
                    name="keyword"
                    label="?????????"
                    rules={[
                        {
                            required: true,
                            message: '?????????????????????',
                        },
                    ]}
                >
                    <Input placeholder="?????????????????????"/>
                </Form.Item>
                <Form.Item name="sources" label="?????????">
                    <Checkbox.Group>
                        <Row>
                            {Object.keys(sources).map(sourceKey => {
                                return (
                                    <Col span={{md: 8, lg: 4}} key={sourceKey}>
                                        <Checkbox value={sourceKey} style={{lineHeight: '32px'}}>
                                            {sources[sourceKey]}
                                        </Checkbox>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Checkbox.Group>
                </Form.Item>

                <Form.Item wrapperCol={{span: 12, offset: 6}}>
                    <Button type="primary" htmlType="submit">
                        ??????
                    </Button>
                </Form.Item>
            </Form>
            <Divider/>
            {audioUrl ? <ReactAudioPlayer src={audioUrl} autoPlay controls/> : null}
            <Divider/>
            <Table columns={columns} dataSource={resultData} onChange={onChange} pagination={{pageSize: 100}}/>
        </div>
    )
};

export default App;