import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table } from "antd";

import {
    getGetFieldsQueryKey,
    useCreateField,
    useDeleteField,
    useGetFields,
    useUpdateField,
} from "@/api/generated/zerocode/field-definition-controller/field-definition-controller";
import type { CreateRequest, UpdateRequest } from "@/api/generated/zerocode/models";
// Not re-exported from models/index.ts: the current Orval output types the field controller with the
// item DTOs (backend records share the names CreateRequest/UpdateRequest/Response), so use these directly.
import type { FieldDefinitionCreateRequest } from "@/api/generated/zerocode/models/fieldDefinitionCreateRequest";
import { FieldDefinitionCreateRequestType } from "@/api/generated/zerocode/models/fieldDefinitionCreateRequestType";
import type { FieldDefinitionResponse } from "@/api/generated/zerocode/models/fieldDefinitionResponse";
import type { FieldDefinitionUpdateRequest } from "@/api/generated/zerocode/models/fieldDefinitionUpdateRequest";
import { zerocodeRequest } from "@/shared/api";

type FieldType = (typeof FieldDefinitionCreateRequestType)[keyof typeof FieldDefinitionCreateRequestType];

interface FormValues {
    label: string;
    type: FieldType;
    required?: boolean;
    maxLength?: number | null;
    min?: number | null;
    max?: number | null;
}

function buildConstraints(values: FormValues): Record<string, unknown> {
    const constraints: Record<string, unknown> = {};
    if (values.type === 'TEXT' && values.maxLength != null) {
        constraints.maxLength = values.maxLength;
    }
    if (values.type === 'NUMBER') {
        if (values.min != null) constraints.min = values.min;
        if (values.max != null) constraints.max = values.max;
    }
    return constraints;
}

function errorText(error: unknown): string {
    const data = (error as { response?: { data?: { message?: string; detail?: string; errors?: unknown } } })?.response?.data;
    if (data?.errors) return JSON.stringify(data.errors);
    return data?.detail ?? data?.message ?? (error as Error)?.message ?? 'Request failed';
}

export default function FieldsManagementPage() {
    const queryClient = useQueryClient();
    const [form] = Form.useForm<FormValues>();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<FieldDefinitionResponse | null>(null);
    const selectedType = Form.useWatch('type', form);

    const { data: rawData, isLoading } = useGetFields({ request: zerocodeRequest });
    const data = rawData as unknown as FieldDefinitionResponse[] | undefined;

    const refresh = () => queryClient.invalidateQueries({ queryKey: getGetFieldsQueryKey() });

    const createMutation = useCreateField({ request: zerocodeRequest });
    const updateMutation = useUpdateField({ request: zerocodeRequest });
    const deleteMutation = useDeleteField({ request: zerocodeRequest });

    function openCreate() {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({ required: false });
        setModalOpen(true);
    }

    function openEdit(record: FieldDefinitionResponse) {
        setEditing(record);
        const constraints = (record.constraints ?? {}) as Record<string, unknown>;
        form.resetFields();
        form.setFieldsValue({
            label: record.label,
            type: record.type as FieldType,
            required: record.required,
            maxLength: (constraints.maxLength as number) ?? null,
            min: (constraints.min as number) ?? null,
            max: (constraints.max as number) ?? null,
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    }

    async function onSubmit() {
        const values = await form.validateFields();
        const constraints = buildConstraints(values);
        try {
            if (editing?.id) {
                // Generated hook is typed with the item UpdateRequest (Orval name clash), cast to the field DTO.
                const body: FieldDefinitionUpdateRequest = {
                    // type is immutable on the backend (409), so it is not sent on update.
                    label: values.label,
                    required: !!values.required,
                    constraints,
                    displayOrder: editing.displayOrder,
                };
                await updateMutation.mutateAsync({ id: editing.id, data: body as unknown as UpdateRequest });
                message.success('Field updated');
            } else {
                const body: FieldDefinitionCreateRequest = {
                    label: values.label,
                    type: values.type,
                    required: !!values.required,
                    constraints,
                };
                await createMutation.mutateAsync({ data: body as unknown as CreateRequest });
                message.success('Field created');
            }
            closeModal();
            await refresh();
        } catch (error) {
            message.error(errorText(error));
        }
    }

    async function onDelete(id: string) {
        try {
            await deleteMutation.mutateAsync({ id });
            message.success('Field deleted');
            await refresh();
        } catch (error) {
            message.error(errorText(error));
        }
    }

    const columns = [
        {
            title: 'Field key',
            dataIndex: 'fieldKey',
            key: 'fieldKey',
        },
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Required',
            dataIndex: 'required',
            key: 'required',
            render: (value: boolean) => value ? 'yes' : 'no',
        },
        {
            title: 'Constraints',
            dataIndex: 'constraints',
            key: 'constraints',
            render: (value?: Record<string, unknown>) =>
                Object.entries(value ?? {}).map(([key, v]) => `${key}=${String(v)}`).join(', '),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: FieldDefinitionResponse) => (
                <Space>
                    <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
                    <Popconfirm
                        title="Delete this field?"
                        onConfirm={() => record.id && onDelete(record.id)}
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger loading={deleteMutation.isPending && deleteMutation.variables?.id === record.id}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <div>
        <Button onClick={openCreate} type="primary">Add field</Button>

        <Table
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data ?? []} />

        <Modal
            title={editing ? 'Edit field' : 'Add field'}
            open={modalOpen}
            onOk={onSubmit}
            onCancel={closeModal}
            okText={editing ? 'Save' : 'Create'}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
            forceRender
        >
            <Form form={form} layout="vertical">
                <Form.Item name="label" label="Label" rules={[{ required: true, whitespace: true, message: 'Label is required' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Type is required' }]}>
                    <Select
                        disabled={!!editing}
                        options={Object.values(FieldDefinitionCreateRequestType).map((t) => ({ value: t, label: t }))}
                    />
                </Form.Item>
                <Form.Item name="required" valuePropName="checked">
                    <Checkbox>Required</Checkbox>
                </Form.Item>
                {selectedType === 'TEXT' && (
                    <Form.Item name="maxLength" label="Max length">
                        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                )}
                {selectedType === 'NUMBER' && (
                    <>
                        <Form.Item name="min" label="Min">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            name="max"
                            label="Max"
                            dependencies={['min']}
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const min = getFieldValue('min');
                                        if (value == null || min == null || value >= min) return Promise.resolve();
                                        return Promise.reject(new Error('Max must be >= min'));
                                    },
                                }),
                            ]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    </div>;
}
