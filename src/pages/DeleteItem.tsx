import ItemForm from "../components/ItemForm";

function DeleteItem() {
  return (
     <div className="flex justify-center min-h-screen flex-col items-center">
      <ItemForm mode="delete" />
    </div>
  );
}

export default DeleteItem;