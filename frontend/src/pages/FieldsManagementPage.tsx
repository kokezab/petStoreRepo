import { Table } from "antd";

export default function FieldsManagementPage() {

    // - Array [
    // -   Object {
    // -     "Constraints": "maxlength=40",
    // -     "Field key": "color",
    // -     "Label": "color",
    // -     "Required": "no",
    // -     "Type": "text",
    // -   },
    // -   Object {
    // -     "Constraints": "min=0",
    // -     "Field key": "quantity",
    // -     "Label": "quantity",
    // -     "Required": "yes",
    // -     "Type": "number",
    // -   },
    // - ]

    return <div>
        <Table
        columns={[
            {
                title: 'Field key',
                dataIndex: 'Field key',
                key: 'Field key',
            },
            {
                title: 'Label',
                dataIndex: 'Label',
                key: 'Label',
            },
            {
                title: 'Type',
                dataIndex: 'Type',
                key: 'Type',
            },
            {
                title: 'Required',
                dataIndex: 'Required',
                key: 'Required',
            },
            {
                title: 'Constraints',
                dataIndex: 'Constraints',
                key: 'Constraints',
            },
        ]}
        dataSource={[
            {
                "Constraints": "maxlength=40",
                "Field key": "color",
                "Label": "color",
                "Required": "no",
                "Type": "text",
            },
            {
                "Constraints": "min=0",
                "Field key": "quantity",
                "Label": "quantity",
                "Required": "yes",
                "Type": "number",
            }
        ]} />
    </div>;
}