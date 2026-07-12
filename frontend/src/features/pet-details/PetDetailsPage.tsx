import { useGetPetById } from "@/api/generated/pet/pet";
import { Button } from "antd";
import { useParams } from "react-router";

export function PetDetailsPage() {
const { id } = useParams<{ id: string }>();

const { data: pet } = useGetPetById(Number(id));

if (!pet) {
    return <div>Pet not found</div>;
}

    return (
        <div>
            <Button type="link" href="/pets">Back to list</Button>
            <h1>Details for pet {id}</h1>
            <h1>{pet?.name}</h1>
            <h2>{pet?.status}</h2>
            <h3>{pet?.category?.name}</h3>
            <h3>
                {pet?.tags?.map((tag) => tag.name).join(", ")}
            </h3>
            <div>
                {pet?.photoUrls?.map((photoUrl) => (
                    <img key={photoUrl} src={photoUrl} alt={pet.name} />
                ))}
            </div>
        </div>
    );
}