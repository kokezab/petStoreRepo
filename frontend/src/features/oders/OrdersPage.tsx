import { Button, Form } from 'antd';

export function OrdersPage() {
  const onFinish = () => {};

  return (
    <div>
      <button>Create order</button>

      <Form aria-label='Create order' onFinish={onFinish}>
        <Form.Item
          name='name'
          label='Name'
          rules={[{ required: true, message: 'Pet is required' }]}
        >
          <input />
        </Form.Item>

        <Form.Item name='Save'>
          <Button htmlType='submit'>Save</Button>
        </Form.Item>
      </Form>
    </div>
  );
}
