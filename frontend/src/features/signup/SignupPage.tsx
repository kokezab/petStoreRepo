import { Form, Input } from 'antd';

export function SignupPage() {
  return (
    <div>
      <h1>Signup</h1>
      <Form name='signup-form' aria-label='Sign Up'>
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
          name='email'
          label='Email'
          rules={[{ required: true, message: 'Email is required' }]}
        >
          <Input type='email' />
        </Form.Item>
        <Form.Item
          required
          name='password'
          label='Password'
          rules={[{ required: true, message: 'Password is required' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          required
          name='firstName'
          label='First Name'
          rules={[{ required: true, message: 'First Name is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          required
          name='lastName'
          label='Last Name'
          rules={[{ required: true, message: 'Last Name is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          required
          name='phone'
          label='Phone'
          rules={[{ required: true, message: 'Phone is required' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </div>
  );
}
