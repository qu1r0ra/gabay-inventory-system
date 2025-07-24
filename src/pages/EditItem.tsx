import ItemForm from "../components/ItemForm";

function EditItem() {
  return (
    <div className="flex mt-8 mx-2 min-h-screen flex-col items-center">
      <ItemForm mode="edit" />
    </div>
  );
}

export default EditItem;
