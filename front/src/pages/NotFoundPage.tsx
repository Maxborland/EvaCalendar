import { Link } from 'react-router-dom'; // Предполагается использование react-router

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-5 bg-theme-light dark:bg-theme-dark">
      <h1 className="text-6xl font-bold text-theme-danger mb-4">
        Ошибка 404
      </h1>
      <p className="text-xl text-theme-gray-dark dark:text-theme-gray-light mb-2">
        Страница не найдена.
      </p>
      <p className="text-md text-theme-gray-medium dark:text-theme-gray-light mb-8 max-w-md">
        К сожалению, запрашиваемая вами страница не существует.
        Возможно, вы ошиблись в адресе или страница была перемещена.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-theme-primary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-80 transition-colors duration-300"
      >
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFoundPage;