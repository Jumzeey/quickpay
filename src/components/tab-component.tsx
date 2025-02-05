import { useState } from 'react';

const TabComponent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(1);

    const handleTabClick = (tabNumber: number) => {
        setActiveTab(tabNumber);
    };

    const requestScript = `
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://app.sarepay.com/api/payment/create',
    'headers': {},
    formData: {
      'token': 'MERCHANT_KEY',
      'public_key': 'PUBLIC_KEY',
      'callback_url': 'https://yourdomain.com/success',
      'reference_code': 'ref_1',
      'amount': '10',
      'email': 'test@email.com',
      'first_name': 'jhone',
      'last_name': 'doe',
      'title': 'test payment',
      'description': 'payment description',
      'quantity': '1',
      'currency': 'USD'
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
  });
`;

    return (
        <div className=" mt-10">
            <div className="flex border p-2 rounded">
                <button
                    className={`${activeTab === 1 ? 'bg-blue-500 text-white rounded' : ''
                        } px-4 py-2`}
                    onClick={() => handleTabClick(1)}
                >
                    cUrl
                </button>
                <button
                    className={`${activeTab === 2 ? 'bg-blue-500 text-white rounded' : ''
                        } px-4 py-2`}
                    onClick={() => handleTabClick(2)}
                >
                    PHP
                </button>
                <button
                    className={`${activeTab === 3 ? 'bg-blue-500 text-white rounded' : ''
                        } px-4 py-2`}
                    onClick={() => handleTabClick(3)}
                >
                    Nodejs-Request
                </button>
                <button
                    className={`${activeTab === 4 ? 'bg-blue-500 text-white rounded' : ''
                        } px-4 py-2`}
                    onClick={() => handleTabClick(4)}
                >
                    Python
                </button>
            </div>
            <div className="border border-gray-300 shadow-lg p-6 mt-10">
                {activeTab === 1 && <div>


                    <pre className='text-[#007AB5]'>{requestScript}</pre>


                </div>}
                {activeTab === 2 && <pre className='text-[#007AB5]'>{requestScript}</pre>}
                {activeTab === 3 && <pre className='text-[#007AB5]'>{requestScript}</pre>}
                {activeTab === 4 && <pre  className='text-[#007AB5]'>{requestScript}</pre>}
            </div>
        </div>
    );
};

export default TabComponent;
