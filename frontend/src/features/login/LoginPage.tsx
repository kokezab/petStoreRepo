import { Alert, Button, Form, Input, Space } from 'antd';

import { useLogin } from './hooks/useLogin';

export type LoginFormValues = {
  username: string;
  password: string;
};

export function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const { login, isPending, error } = useLogin();

  return (
    <div>
      <h1>Log in</h1>
      <Space orientation='vertical' style={{ width: '100%' }} size='large'>
        {error && <Alert type='error' title={error} showIcon />}
        <Form<LoginFormValues> onFinish={login} form={form} name='login-form' aria-label='Log In'>
          <Form.Item
            required
            name='username'
            label='Username'
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            required
            name='password'
            label='Password'
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={isPending}>
              Log In
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </div>
  );
}
