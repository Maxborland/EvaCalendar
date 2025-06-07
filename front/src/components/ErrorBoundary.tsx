import { useRouteError } from 'react-router-dom';

export default function ErrorBoundary() {
        const error = useRouteError();
        console.error(error);

        const handleRefresh = () => {
                window.location.reload();
        };

        return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                        <div className="text-center">
                                <h1 className="text-4xl font-bold text-red-500 mb-4">Что-то пошло не так.</h1>
                                <p className="text-lg text-gray-700 mb-8">Попробуйте обновить страницу.</p>
                                <button
                                        onClick={handleRefresh}
                                        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                                >
                                        Обновить страницу
                                </button>
                        </div>
                </div>
        );
}