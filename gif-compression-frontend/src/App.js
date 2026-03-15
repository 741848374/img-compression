import { useState } from "react";
import { Upload, message, Form, Button, InputNumber, Spin } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import { splitUint8Array } from "./utils";
const { Dragger } = Upload;

const ALLOWED_TYPES = [
  "image/gif",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

function App() {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const beforeUpload = (file) => {
    const isImage = ALLOWED_TYPES.includes(file.type);
    if (!isImage) {
      message.error(`${file.name} 不是支持的图片格式（gif/png/jpg/webp）`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const props = {
    name: "file",
    multiple: true,
    accept: "image/*",
    action: "/upload",
    beforeUpload,
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        const filePath = info.file.response;
        const extname = info.file.name.split(".").pop();
        const filename = info.file.name;
        setFileList((pre) => [...pre, { filePath, extname, filename }]);
        message.success(`${info.file.name} 上传成功`);
      } else if (status === "error") {
        message.error(`${info.file.name} 上传失败`);
      }
    },
    onRemove(file) {
      setFileList((pre) => pre.filter((f) => f.filename !== file.name));
    },
  };

  const compress = async (values) => {
    if (!fileList.length) {
      message.warning("请先上传图片");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/compression", {
        params: {
          color: values.color ?? 256,
          level: values.level ?? 9,
          fileList: JSON.stringify(fileList),
        },
        responseType: "arraybuffer",
      });
      const uint8Array = new Uint8Array(res.data);
      const SEPARATOR = new TextEncoder().encode("---IMAGE--SEPARATOR---");
      const images = splitUint8Array(uint8Array, SEPARATOR);

      images.forEach((imgData, index) => {
        if (!imgData.length) return;
        const blob = new Blob([imgData]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const originalName = fileList[index]?.filename || `${index + 1}`;
        a.download = `compressed_${originalName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      message.success("全部压缩完成！");
    } catch (e) {
      message.error("压缩失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Spin spinning={loading} tip="压缩中...">
        <Form
          style={{ width: 500, margin: "50px auto" }}
          form={form}
          onFinish={compress}
          initialValues={{ color: 256, level: 9 }}
        >
          <Form.Item
            label="颜色数量"
            name="color"
            tooltip="gif/png 调色板颜色数，范围 2~256"
          >
            <InputNumber min={2} max={256} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="压缩级别"
            name="level"
            tooltip="gif/png 压缩努力程度 1~10，jpeg 质量 1~100"
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽上传图片</p>
              <p className="ant-upload-hint">
                支持 gif、png、jpg、webp 格式，可多选
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              压缩并下载
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
}

export default App;
