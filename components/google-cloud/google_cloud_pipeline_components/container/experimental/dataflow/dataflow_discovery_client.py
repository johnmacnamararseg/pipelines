# Copyright 2021 The Kubeflow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Discovery client for Dataflow jobs."""

import abc
import functools
import logging
import time
from typing import Any, Callable, Optional

import googleapiclient.discovery as discovery


def with_retries(
    func: Callable,  # pylint: disable=g-bare-generic
    on_error: Optional[Callable[[], Any]] = None,
    number_of_retries: int = 5,
    delay: float = 1,
):
  """Retry decorator for dataflow discovery client.

  The decorator catches BrokenPipeError and IOError, calls `on_error` and
  retries after waiting
  `delay` seconds.
  Args:
    func: Function to apply the retry logic to.
    on_error: Optional function to trigger when an arror happens.
    number_of_retries (int): Total number of retries if error is raised.
    delay (float): Number of seconds to wait between consecutive retries.

  Returns:
    A wrapped function with retry logic.
  """

  @functools.wraps(func)
  def wrapper(self, *args, **kwargs):
    remaining_retries = number_of_retries
    while remaining_retries:
      try:
        return func(self, *args, **kwargs)
      except (BrokenPipeError, IOError) as e:
        remaining_retries -= 1
        if not remaining_retries:
          raise

        logging.warning('Caught %s. Retrying in %s seconds...',
                        e.__class__.__name__, delay)

        time.sleep(delay)
        if on_error:
          on_error()

  return wrapper


class ClientWithRetries(abc.ABC):
  """A helper class for creating Dataflow Discovery Client with retries."""

  def __init__(self):
    self._build_client()
    for name, member in self.__dict__.items():
      if callable(member) and not name.startswith('_'):
        self.__dict__[name] = with_retries(
            func=member, on_error=self._build_client)

  @abc.abstractmethod
  def _build_client(self):
    raise NotImplementedError()


class DataflowClient(ClientWithRetries):
  """A Discovery based client for managing Dataflow jobs."""

  def _build_client(self):
    self._df = discovery.build('dataflow', 'v1b3', cache_discovery=False)
