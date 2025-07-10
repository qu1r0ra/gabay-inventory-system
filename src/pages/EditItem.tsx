import ItemForm from "../components/ItemForm";

function EditItem() {
  return (
     <div className="flex justify-center min-h-screen flex-col items-center">
      <ItemForm mode="edit" />
    </div>
  );
}

export default EditItem;